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
        console.log('[DATABASE] Connecting to database...');
        // Connect to the database using Prisma
        await prisma.$connect();
        logger.info(`Database connected successfully to ${config.database.url.split('@')[1]}`);
        console.log(`[DATABASE] Connected successfully to ${config.database.url.split('@')[1]}`);
    } catch (error) {
        logger.error('Error connecting to database:', error);
        console.error('[DATABASE] Error connecting to database:', error);
        throw error; // Re-throw to allow server.js to handle startup failure
    }
}

/**
 * Disconnects from the database
 * @returns {Promise<void>}
 */
async function disconnectDatabase() {
    try {
        console.log('[DATABASE] Disconnecting from database...');
        // Disconnect from the database
        await prisma.$disconnect();
        logger.info('Database disconnected successfully');
        console.log('[DATABASE] Disconnected successfully');
    } catch (error) {
        logger.error('Error disconnecting from database:', error);
        console.error('[DATABASE] Error disconnecting from database:', error);
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
    console.log(`[DATABASE] Creating new project: "${title}"`);
    const project = await prisma.project.create({ data: { title, description } });
    console.log(`[DATABASE] Project created with ID: ${project.id}`);
    return project;
}

/**
 * Retrieves a paginated list of projects with their associated files
 * @param {object} options - Pagination options
 * @param {number} options.page - The current page number (1-based)
 * @param {number} options.limit - The number of items per page
 * @returns {Promise<object>} - Object containing projects data and pagination metadata
 */
async function getProjects({ page, limit }) {
    console.log(`[DATABASE] Fetching projects (page: ${page}, limit: ${limit})`);
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
    console.log(`[DATABASE] Found ${projects.length} projects (total: ${total})`);

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
    console.log(`[DATABASE] Fetching project by ID: ${id}`);
    const project = await prisma.project.findUnique({
        where: { id },
        include: { files: true }
    });

    if (project) {
        console.log(`[DATABASE] Found project: "${project.title}" with ${project.files.length} files`);
    } else {
        console.log(`[DATABASE] Project with ID ${id} not found`);
    }

    return project;
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
    console.log(`[DATABASE] Creating file record: "${filename}" for project ${projectId}`);
    const file = await prisma.file.create({
        data: { projectId, filename, url, fileSize }
    });
    console.log(`[DATABASE] File record created with ID: ${file.id}`);
    return file;
}

/**
 * Creates a new processing job record
 * @param {string} jobId - The unique identifier for the processing job
 * @param {string} documentId - The ID of the document being processed
 * @returns {Promise<object>} - The created processing job object
 */
async function createProcessingJob(jobId, documentId) {
    console.log(`[DATABASE] Creating processing job: ${jobId} for document ${documentId}`);
    const job = await prisma.processingJob.create({
        data: { jobId, documentId }
    });
    console.log(`[DATABASE] Processing job created with ID: ${job.id}`);
    return job;
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
