// File upload route: saves PDF to MinIO, creates DB record, sends processing job to RabbitMQ
const express = require('express');
const router = express.Router();
const Busboy = require('busboy');
const { uploadStream } = require('../services/minioService'); // Service for file storage operations
const { publishProcessingJob } = require('../services/rabbitmqService'); // Service for message queue operations
const { createFile, createProcessingJob, getProjectById } = require('../services/prismaService'); // Database operations
const { asyncHandler, createSuccessResponse, createErrorResponse } = require('../utils/helpers'); // Utility functions
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

/**
 * POST route for file upload
 * Processes the uploaded file, stores it, and queues it for processing
 * 
 * @param {Object} req - Express request object with file in req.file and projectId in req.body
 * @param {Object} res - Express response object
 */
router.post('/', asyncHandler(async (req, res) => {
    try {
        const result = await parseMultipartUpload(req);
        
        if (!result.files || result.files.length === 0) {
            return res.status(400).json(createErrorResponse('No file uploaded'));
        }

        // Return the first successfully uploaded file (assuming single file upload)
        const uploadedFile = result.files[0];
        
        return res.status(201).json(createSuccessResponse({
            fileId: uploadedFile.fileRecord.id,
            filename: uploadedFile.fileRecord.filename,
            size: uploadedFile.fileRecord.fileSize,
            processingStatus: uploadedFile.fileRecord.processingStatus,
            uploadedAt: uploadedFile.fileRecord.createdAt,
        }, 'File uploaded'));

    } catch (error) {
        // Handle specific error types for better client feedback
        if (error.code === 'INVALID_FILE_TYPE') {
            return res.status(400).json(createErrorResponse(error.message));
        }
        if (error.code === 'PROJECT_NOT_FOUND') {
            return res.status(404).json(createErrorResponse(error.message));
        }
        if (error.code === 'UPLOAD_FAILED') {
            return res.status(500).json(createErrorResponse(error.message));
        }
        
        return res.status(500).json(createErrorResponse('Upload failed: ' + error.message));
    }
}));

// Helper function to parse multipart data with Promise-based approach
const parseMultipartUpload = (req) => {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: req.headers });
        let projectId;
        const pendingUploads = [];
        let hasFiles = false;

        // Handle form fields
        busboy.on('field', (fieldname, val) => {
            if (fieldname === 'projectId') {
                projectId = val;
            }
        });

        // Handle file uploads
        busboy.on('file', (fieldname, file, fileInfo) => {
            // const { filename, mimeType } = fileInfo;
            
            // Only process 'file' field
            if (fieldname !== 'file') {
                file.resume();
                return;
            }

            hasFiles = true;
            
            // Create promise for this file upload
            const uploadPromise = processFileUpload(file, fileInfo, projectId);
            pendingUploads.push(uploadPromise);
        });

        // Handle completion of parsing
        busboy.on('finish', async () => {
            try {
                if (!hasFiles) {
                    return resolve({ projectId, files: [] });
                }

                // Wait for all file uploads to complete
                const results = await Promise.allSettled(pendingUploads);
                
                // Filter successful uploads and collect any errors
                const successfulUploads = [];
                const errors = [];

                results.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        successfulUploads.push(result.value);
                    } else {
                        errors.push(result.reason);
                    }
                });

                // If all uploads failed, reject with the first error
                if (successfulUploads.length === 0 && errors.length > 0) {
                    return reject(errors[0]);
                }

                resolve({ projectId, files: successfulUploads });
            } catch (error) {
                reject(error);
            }
        });

        // Handle parsing errors
        busboy.on('error', (error) => {
            reject(error);
        });

        // Start parsing
        req.pipe(busboy);
    });
};

// Individual file processing function - handles the complete lifecycle of one file upload
// This function encapsulates all the async operations needed for a single file:
// validation → upload → database storage → job creation → message queue publishing
const processFileUpload = async (file, fileInfo, projectId) => {
    const { filename, mimeType } = fileInfo;

    // === VALIDATION PHASE ===
    
    // File type validation - business rule enforcement
    // Only PDF files are allowed per business requirements
    if (mimeType !== 'application/pdf') {
        file.resume();                    // CRITICAL: Must discard stream to prevent memory leak
        const error = new Error('Only PDF files are allowed');
        error.code = 'INVALID_FILE_TYPE'; // Structured error code for proper HTTP status mapping
        throw error;
    }

    // Project existence validation - referential integrity check
    // Validates that the provided projectId exists before allowing file upload
    const project = await getProjectById(projectId);
    if (!project) {
        file.resume();                    // CRITICAL: Must discard stream to prevent memory leak
        const error = new Error('Project not found');
        error.code = 'PROJECT_NOT_FOUND'; // Structured error code for 404 response
        throw error;
    }

    // === PROCESSING PHASE ===
    
    try {
        // Generate unique storage path to prevent filename collisions
        // Pattern: uploads/timestamp_originalfilename.pdf
        // This ensures uniqueness while preserving some semantic meaning for debugging
        const minioPath = `uploads/${Date.now()}_${filename}`;
        
        // Upload file stream directly to MinIO object storage
        // This streams the file without loading it entirely into memory - crucial for large files
        // Returns metadata including the actual file size after upload completion
        const { size } = await uploadStream(minioPath, file, mimeType);
        
        // Create database record for the uploaded file
        // This establishes the file's presence in the system and provides a reference ID
        // Essential for tracking, auditing, and later retrieval
        const fileRecord = await createFile(projectId, filename, minioPath, size);
        
        // Generate unique job identifier for async processing
        // UUID ensures global uniqueness across distributed systems and multiple instances
        const jobId = uuidv4();
        
        // Create processing job record in database
        // This creates an audit trail and allows job status tracking/monitoring
        // Links the file to its processing job for status queries
        await createProcessingJob(jobId, fileRecord.id);
        
        // Prepare metadata for the processing pipeline
        // This metadata travels with the job through the processing pipeline
        // Includes original filename for user display, MIME type for processing hints, size for validation
        const metadata = { 
            originalName: fileInfo.filename,  // User-provided filename for display purposes
            mimeType: fileInfo.mimeType,     // MIME type for processing pipeline decisions
            size                             // File size for validation and progress tracking
        };
        
        // Publish processing job to message queue (RabbitMQ/Kafka)
        // This decouples file upload from file processing, enabling:
        // - Horizontal scaling of processing workers
        // - Retry logic for failed processing
        // - Load balancing across processing instances
        // - Monitoring and observability of processing pipeline
        await publishProcessingJob({
            jobId,                           // Unique job identifier for tracking
            projectId,                       // Business context for processing rules
            filename: fileRecord.filename,   // Database filename (may differ from original)
            fileId: fileRecord.id,          // Database primary key for updates
            minioPath,                      // Object storage path for worker access
            metadata                        // Additional context for processing
        });

        // Return all relevant data for the upload response
        // This allows the caller to provide comprehensive feedback to the client
        return {
            fileRecord,                     // Complete database record with timestamps, IDs, etc.
            jobId,                         // Job identifier for status tracking APIs
            metadata                       // File metadata for client display
        };

    } catch (error) {
        // Centralized error handling for all infrastructure failures
        // Could be MinIO connectivity, database errors, RabbitMQ publishing failures, etc.
        // Wrapping with specific error code enables proper HTTP status and client handling
        const uploadError = new Error(`Upload failed: ${error.message}`);
        uploadError.code = 'UPLOAD_FAILED'; // Maps to HTTP 500 Internal Server Error
        throw uploadError;
    }
};

module.exports = router;
