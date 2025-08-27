// Simple request validators with Joi
const Joi = require('joi');
const { createErrorResponse } = require('../utils/helpers');

/**
 * Schema for validating project data
 * Ensures project submissions contain required fields with appropriate constraints
 */
const projectSchema = Joi.object({
    title: Joi.string().min(1).max(100).required(), // Project title: non-empty string with max 100 chars
    description: Joi.string().min(1).max(500).required(), // Project description: non-empty string with max 500 chars
});

/**
 * Middleware to validate project data in request body
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Object|undefined} Error response if validation fails, otherwise proceeds to next middleware
 */
function validateProject(req, res, next) {
    // Validate request body against the project schema
    const { error } = projectSchema.validate(req.body);

    // If validation error occurs, return 400 Bad Request with the error message
    if (error) return res.status(400).json(createErrorResponse(error.details[0].message));

    // If validation passes, proceed to the next middleware/controller
    next();
}

/**
 * Schema for validating chat message data
 * Ensures chat messages contain required fields with appropriate constraints
 */
const chatSchema = Joi.object({
    message: Joi.string().min(1).max(10000).required(), // User's message: non-empty string with max 10000 chars
    projectId: Joi.string().required(), // Project ID the chat belongs to
    chatHistory: Joi.array().items(
        Joi.object({
            content: Joi.string().required(), // Message content
            role: Joi.string().valid('user', 'assistant').required(), // Message sender role (user or assistant only)
            timestamp: Joi.number().required(), // Message timestamp (as numeric value)
        })
    ).optional(), // Chat history is optional
});

/**
 * Middleware to validate chat message data in request body
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Object|undefined} Error response if validation fails, otherwise proceeds to next middleware
 */
function validateChat(req, res, next) {
    // Validate request body against the chat schema
    const { error } = chatSchema.validate(req.body);

    // If validation error occurs, return 400 Bad Request with the error message
    if (error) return res.status(400).json(createErrorResponse(error.details[0].message));

    // If validation passes, proceed to the next middleware/controller
    next();
}

module.exports = { validateProject, validateChat };
