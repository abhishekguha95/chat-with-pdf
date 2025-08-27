/**
 * Collection of utility helper functions for handling API responses and error handling
 */

/**
 * Creates a standardized success response object
 * @param {any} data - The payload data to return to the client
 * @param {string} message - A descriptive message about the successful operation
 * @returns {Object} - A formatted success response with consistent structure
 */
function createSuccessResponse(data, message) {
    return { success: true, data, message };
}

/**
 * Creates a standardized error response object
 * @param {Error|any} error - The error object or error information
 * @param {string} message - A user-friendly error message describing what went wrong
 * @returns {Object} - A formatted error response with consistent structure
 */
function createErrorResponse(error, message) {
    return { success: false, error, message };
}

/**
 * Higher-order function that wraps route handlers to handle promise rejections
 * Eliminates the need for try/catch blocks in each route handler
 * @param {Function} fn - The async Express route handler function to wrap
 * @returns {Function} - A wrapped function that forwards any errors to Express's next() middleware
 */
function asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { createSuccessResponse, createErrorResponse, asyncHandler };
