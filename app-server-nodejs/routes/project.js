// Project Router - Handles all project-related HTTP endpoints
// This router implements RESTful API operations for the Project resource
const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById } = require('../services/prismaService');
const { asyncHandler, createSuccessResponse, createErrorResponse } = require('../utils/helpers');
const { validateProject } = require('../middleware/validation');

/**
 * POST / - Create a new project
 * 
 * Endpoint to create a new project in the database
 * Uses validateProject middleware to ensure request body contains valid data
 * Returns the created project with a 201 Created status
 */
router.post('/', validateProject, asyncHandler(async (req, res) => {
    // Extract project details from request body
    const { title, description } = req.body;
    // Create project in database using Prisma service
    const project = await createProject(title, description);
    // Return success response with 201 Created status
    res.status(201).json(createSuccessResponse(project, 'Project created'));
}));

/**
* GET / - Retrieve a paginated list of projects
* 
* Supports pagination through query parameters:
* - page: Current page number (defaults to 1)
* - limit: Number of records per page (defaults to 10)
* Returns an array of projects with pagination metadata
*/
router.get('/', asyncHandler(async (req, res) => {
    // Parse pagination parameters with defaults
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    // Fetch projects from database with pagination
    const result = await getProjects({ page, limit });
    // Return paginated projects
    res.json(createSuccessResponse(result));
}));

/**
* GET /:id - Retrieve a specific project by ID
* 
* Fetches a single project by its unique identifier
* Returns 404 Not Found if the project doesn't exist
*/
router.get('/:id', asyncHandler(async (req, res) => {
    // Fetch project by ID from database
    const project = await getProjectById(req.params.id);
    // Return 404 error if project not found
    if (!project) {
        res.status(404).json(createErrorResponse('Project not found'));
        return;
    }
    // Return project data
    res.json(createSuccessResponse(project));
}));

module.exports = router;
