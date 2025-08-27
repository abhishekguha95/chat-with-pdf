// API rate limiting middleware
const rateLimit = require('express-rate-limit');
const { config } = require('../config');

/**
 * Rate limiting middleware to protect API from abuse
 * Uses express-rate-limit to control request frequency per IP address
 * 
 * Configuration is loaded from application config:
 * - windowMs: Time window for counting requests (e.g., 15 minutes)
 * - max: Maximum number of requests allowed in the window
 */
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs, // Time window in milliseconds (e.g., 15 * 60 * 1000 for 15 minutes)
    max: config.rateLimit.max, // Maximum requests per IP address within the window
    message: {
        success: false,
        error: 'Too many requests, please try again later.' // Error message returned when rate limit is exceeded
    }
});

module.exports = { limiter };
