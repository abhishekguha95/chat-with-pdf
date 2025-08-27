const { PrismaClient } = require('@prisma/client');
const { config } = require('../config');
const { logger } = require('../utils/logger');

// Initialize a single PrismaClient instance for the entire application
// This follows the singleton pattern to avoid multiple connections
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: config.database.url
        }
    }
});

/**
 * Establishes connection to the database
 * @returns {Promise<void>}
 */
async function connectDatabase() {
    try {
        // Connect to the database using Prisma
        await prisma.$connect();
        logger.info(`Database connected successfully to ${config.database.url.split('@')[1]}`);
    } catch (error) {
        logger.error('Error connecting to database:', error);
        throw error; // Re-throw to allow server.js to handle startup failure
    }
}

/**
 * Disconnects from the database
 * @returns {Promise<void>}
 */
async function disconnectDatabase() {
    try {
        // Disconnect from the database
        await prisma.$disconnect();
        logger.info('Database disconnected successfully');
    } catch (error) {
        logger.error('Error disconnecting from database:', error);
        // Not throwing here as we're in a shutdown process
    }
}

/**
 * Creates a new project in the database
 * @param {string} title - The title of the project
 * @param {string} description - The description of the project
 * @returns {Promise<object>} - The created project object
 */
async function createProject(title, description) {
    return prisma.project.create({ data: { title, description } });
}

/**
 * Retrieves a paginated list of projects with their associated files
 * @param {object} options - Pagination options
 * @param {number} options.page - The current page number (1-based)
 * @param {number} options.limit - The number of items per page
 * @returns {Promise<object>} - Object containing projects data and pagination metadata
 */
async function getProjects({ page, limit }) {
    // Calculate number of records to skip based on page and limit
    const skip = (page - 1) * limit;

    // Fetch the requested projects with their files, ordered by creation date (newest first)
    const projects = await prisma.project.findMany({
        skip,
        take: limit,
        include: { files: true },
        orderBy: { createdAt: 'desc' }
    });

    // Get the total count of projects for pagination calculations
    const total = await prisma.project.count();

    // Return both the data and pagination metadata
    return {
        data: projects,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * Retrieves a specific project by its ID, including associated files
 * @param {string|number} id - The unique identifier of the project
 * @returns {Promise<object|null>} - The project object or null if not found
 */
async function getProjectById(id) {
    return prisma.project.findUnique({
        where: { id },
        include: { files: true }
    });
}

/**
 * Creates a new file record associated with a project
 * @param {string|number} projectId - The ID of the project the file belongs to
 * @param {string} filename - The name of the file
 * @param {string} url - The storage location/URL of the file
 * @param {number} fileSize - The size of the file in bytes
 * @returns {Promise<object>} - The created file object
 */
async function createFile(projectId, filename, url, fileSize) {
    return prisma.file.create({
        data: { projectId, filename, url, fileSize }
    });
}

/**
 * Creates a new processing job record
 * @param {string} jobId - The unique identifier for the processing job
 * @param {string} documentId - The ID of the document being processed
 * @returns {Promise<object>} - The created processing job object
 */
async function createProcessingJob(jobId, documentId) {
    return prisma.processingJob.create({
        data: { jobId, documentId }
    });
}

// Export all database service functions
module.exports = {
    prisma,
    connectDatabase,
    disconnectDatabase,
    createProject,
    getProjects,
    getProjectById,
    createFile,
    createProcessingJob
};
