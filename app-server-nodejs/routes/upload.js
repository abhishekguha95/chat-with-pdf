// File upload route: saves PDF to MinIO, creates DB record, sends processing job to RabbitMQ
const express = require('express');
const router = express.Router();
const multer = require('../middleware/upload');       // Middleware for handling multipart/form-data
const { uploadFile } = require('../services/minioService'); // Service for file storage operations
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
router.post('/', multer.single('file'), asyncHandler(async (req, res) => {
    // Extract projectId from request body and file from multer middleware
    const { projectId } = req.body;
    const file = req.file;

    // Validate input: ensure file was uploaded and projectId was provided
    if (!file) return res.status(400).json(createErrorResponse('No file uploaded'));
    if (!projectId) return res.status(400).json(createErrorResponse('Project ID required'));

    // Verify project exists in database
    const project = await getProjectById(projectId);
    if (!project) return res.status(404).json(createErrorResponse('Project not found'));

    // Upload PDF to MinIO object storage and get the storage path
    const minioPath = await uploadFile(file);

    // Create a record in the database for the uploaded file
    const fileRecord = await createFile(projectId, file.originalname, minioPath, file.size);

    // Generate unique job ID for processing
    const jobId = uuidv4();

    // Create a processing job record in database linked to the file
    await createProcessingJob(jobId, fileRecord.id);

    // Send the processing job to RabbitMQ queue for asynchronous processing
    await publishProcessingJob({
        jobId,                   // Unique identifier for the job
        projectId,
        filename: fileRecord.filename,
        fileId: fileRecord.id, // Reference to the stored file
        minioPath,               // Where the file is stored
        metadata: {
            originalName: file.originalname, // Original filename
            mimeType: file.mimetype,         // File type
            size: file.size,                 // File size in bytes
        },
    });

    // Return success response with file information
    res.status(201).json(createSuccessResponse({
        fileId: fileRecord.id,
        filename: fileRecord.filename,
        size: fileRecord.fileSize,
        processingStatus: fileRecord.processingStatus,
        uploadedAt: fileRecord.createdAt,
    }, 'File uploaded'));
}));

module.exports = router;
