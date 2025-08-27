// Main express app file. You only define app structure and export it, no server here.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
// const { limiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

// Initialize Express application instance
const app = express();

// Security best practices
// Helmet helps secure Express apps by setting HTTP response headers
app.use(helmet());
// Enable Cross-Origin Resource Sharing - configure which domains can access the API
app.use(cors());

// Rate limiting for abuse prevention
// Prevents brute force attacks and reduces load during traffic spikes
// app.use(limiter);

// Parse incoming JSON requests
// Converts JSON payloads into JavaScript objects accessible via req.body
app.use(express.json());
// Parse URL-encoded bodies (typically from form submissions)
// extended:true allows for rich objects and arrays to be encoded
app.use(express.urlencoded({ extended: true }));

// Request logging for observability
// Logs each incoming request with method and path for monitoring and debugging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next(); // Pass control to the next middleware
});

// Connect main application routes
// All API routes are prefixed with /api for versioning and organization
app.use('/api', routes);

// Central error handler (should always be last middleware)
// Catches all errors thrown in routes/middleware for consistent error responses
app.use(errorHandler);

// Export the configured Express application for use in server.js
module.exports = app;
