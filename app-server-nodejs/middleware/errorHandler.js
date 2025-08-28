// Centralized error handler for the Express app
const { logger } = require('../utils/logger');
const { createErrorResponse } = require('../utils/helpers');

/**
 * Global error handling middleware for Express
 * This catches all errors thrown or passed to next(err) in the application
 * 
 * @param {Error} err - The error object
 * @param {Object} _req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} _next - Express next function (not used here as this is the final error handler)
 * @returns {Object} JSON response with error details
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
    // Log the full error for debugging purposes
    logger.error('Error:', err);

    // Use the error's status code if available, otherwise default to 500 (Internal Server Error)
    const statusCode = err.statusCode || 500;

    // Use the error's message if available, otherwise provide a generic message
    const message = err.message || 'Internal server error';

    // Send JSON response with appropriate status code and formatted error message
    res.status(statusCode).json(createErrorResponse(message));
}

module.exports = { errorHandler };
