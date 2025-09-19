const express = require('express');
const router = express.Router();
const { publishProcessingJob } = require('../services/rabbitmqService'); // Service for message queue operations
const { getFileById, createProcessingJob } = require('../services/prismaService');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, createSuccessResponse, createErrorResponse } = require('../utils/helpers');


router.post('/', asyncHandler(async (req, res) => {
    try {
        const { fileId } = req.body;

        const fileRecord = await getFileById(fileId);

        const jobId = uuidv4();

        // Create processing job record in database
        // This creates an audit trail and allows job status tracking/monitoring
        // Links the file to its processing job for status queries
        await createProcessingJob(jobId, fileRecord.id);

        const metadata = { 
            originalName: fileRecord.filename,  // User-provided filename for display purposes
            mimeType: fileRecord.mimeType,     // MIME type for processing pipeline decisions
            size: fileRecord.size               // File size for validation and progress tracking
        };

        // Publish message to RabbitMQ for asynchronous processing
        await publishProcessingJob({
            jobId,                           // Unique job identifier for tracking
            projectId: fileRecord.projectId, // Business context for processing rules
            filename: fileRecord.filename,   // Database filename (may differ from original)
            fileId: fileRecord.id,          // Database primary key for updates
            minioPath: fileRecord.url,                      // Object storage path for worker access
            metadata                        // Additional context for processing
        });

        res.status(202).json(createSuccessResponse({ jobId }, 'Processing message queued'));
    } catch (error) {
        console.error('Error queuing processing job:', error);
        res.status(500).json(createErrorResponse('Failed to queue processing message'));
    }
}));

module.exports = router;