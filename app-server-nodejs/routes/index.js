/**
 * Main router configuration file
 * This file sets up and mounts all API routes for the chat-with-pdf application
 * and provides a health check endpoint to verify service status.
 */
const express = require('express');
const router = express.Router();

// Import route modules to be mounted
const projectRoutes = require('./project');
const uploadRoutes = require('./upload');
const chatRoutes = require('./chat');
const embeddingRoutes = require('./embedding');

// Mount project-related routes under '/projects' path
// These routes handle project creation, listing, deletion, etc.
router.use('/projects', projectRoutes);

// Mount file upload routes under '/upload' path
// These routes handle document uploading, processing, and storage
router.use('/upload', uploadRoutes);

router.use('/embedding', embeddingRoutes);

// Mount chat interaction routes under '/chat' path
// These routes handle user queries, document-based Q&A, and conversation history
router.use('/chat', chatRoutes);

/**
 * Health check endpoint
 * Provides a simple way to verify that the service is running
 * Returns a 200 OK response with a JSON payload when the server is operational
 */
router.get('/health', (_req, res) => {
    res.json({ success: true, message: 'Service is healthy' });
});

// Export the configured router for use in the main application
module.exports = router;
