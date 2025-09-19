// Handles streaming chat between user/API and Python gRPC chat-service
const express = require('express');
const router = express.Router();
// Import utility functions for handling async routes and creating standardized error responses
const { asyncHandler } = require('../utils/helpers');
// Import the gRPC service function for streaming chat data
const { streamChat } = require('../services/grpcService');
// Import validation middleware to ensure chat request data is properly formatted
// const { validateChat } = require('../middleware/validation');

/**
 * POST /api/chat/stream
 * Endpoint for streaming chat responses from the AI model through gRPC
 * Uses Server-Sent Events (SSE) to provide real-time streaming to the client
 * Validates incoming requests with validateChat middleware
 */
// router.get('/stream', validateChat, asyncHandler(async (req, res) => {
router.get('/stream', asyncHandler(async (req, res) => {
    // Extract required data from request body
    const { message, projectId, chatHistory } = req.query;

    // Configure headers for SSE (Server-Sent Events) stream
    res.setHeader('Content-Type', 'text/event-stream'); // Defines the content type for SSE
    res.setHeader('Cache-Control', 'no-cache');         // Prevents caching of events
    res.setHeader('Connection', 'keep-alive');          // Keeps the connection open
    res.setHeader('Access-Control-Allow-Origin', '*');  // Enables CORS for all origins

    // Initiate streaming chat to Python gRPC backend
    // This creates a bidirectional stream to the Python service
    const stream = streamChat({ message, projectId, chatHistory });

    // Handle incoming data chunks from the gRPC stream
    stream.on('data', (chunk) => {
          if (res.writableEnded) return; // Prevent writing after end
        // If the chunk contains a token (part of AI response), send it immediately to client
        if (chunk.token)
            res.write(`data: ${JSON.stringify({ token: chunk.token })}\n\n`);

        // If the chunk indicates completion, send complete flag and any sources/citations
        // This signals the end of the AI's response
        if (chunk.complete) {
            res.write(`data: ${JSON.stringify({
                complete: true,
                sources: chunk.sources
            })}\n\n`);
            // if (!res.writableEnded) res.end();
        }

        // If the chunk contains an error, forward it to the client and end the stream
        if (chunk.error) {
            if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify({ error: chunk.error })}\n\n`);
                // res.end();
            }
        }
    });

    // Handle errors in the gRPC stream
   
    // stream.on('error', (_err) => {
    //     // Send a generic error message to avoid exposing sensitive details
    //     res.write(`data: ${JSON.stringify({ error: 'Chat service error' })}\n\n`);
    //     res.end(); // Close the SSE stream
    // });
    // eslint-disable-next-line no-unused-vars
    stream.on('error', (_err) => {
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ error: 'Chat service error' })}\n\n`);
            res.end();
        }
    });

    // Handle normal stream completion (if not already ended by complete/error handlers)
        stream.on('end', () => {
        if (!res.writableEnded) res.end();
    });

    // If client disconnects, cancel the gRPC stream to free up resources
    // The conditional check ensures stream.cancel exists before calling it
    req.on('close', () => {
        stream.cancel();
        if (!res.writableEnded) res.end();
    });
}));

module.exports = router;
