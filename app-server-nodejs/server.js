// Handles actual server instantiation; keeps lifecycle management separate from application logic.
// Load environment variables from .env file
// require('dotenv').config();
// Import the configured Express application from app.js
const app = require('./app');
const { config } = require('./config');
const { logger } = require('./utils/logger');
const { connectDatabase, disconnectDatabase } = require('./services/prismaService');
const { initRabbitMQ, closeRabbitMQ } = require('./services/rabbitmqService');
const { initMinio } = require('./services/minioService');
const { initGRPC } = require('./services/grpcService');

// Set server port from config
const port = config.port;

// Self-executing async function for async/await support in the main execution context
(async function initialize() {
    try {
        // Initialize all external services and dependencies sequentially
        // Connect to the database (likely MongoDB/PostgreSQL)
        await connectDatabase();
        console.log('✅ Database connected successfully');

        // Initialize MinIO object storage for file handling (PDF storage)
        await initMinio();
        console.log('✅ MinIO initialized successfully');

        // Set up message queue for asynchronous processing tasks
        await initRabbitMQ();
        console.log('✅ RabbitMQ initialized successfully');

        // Initialize gRPC server/client for high-performance microservice communication
        initGRPC();
        console.log('✅ gRPC initialized successfully');

        // Start the HTTP server after all dependencies are ready
        const server = app.listen(port, () => {
            logger.info(`Server running on port ${port}`);
            console.log(`🚀 Server running on port ${port}`);
        });

        // Graceful shutdown handler to properly close connections
        const shutdown = async (signal) => {
            logger.info(`Received ${signal}, shutting down gracefully...`);
            console.log(`⚠️ Received ${signal}, shutting down gracefully...`);
            // First close the HTTP server to stop accepting new requests
            server.close(async () => {
                // Then close all external connections in an orderly fashion
                await disconnectDatabase();
                console.log('✅ Database disconnected');

                await closeRabbitMQ();
                console.log('✅ RabbitMQ connection closed');

                console.log('👋 Process exiting...');
                // Exit with success code after clean shutdown
                process.exit(0);
            });
        };

        // Register shutdown handlers for different termination signals
        // SIGTERM is sent by container orchestrators (Docker, Kubernetes) to stop the service
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        // SIGINT is sent when user presses Ctrl+C in terminal
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (err) {
        // Log detailed error information if any service fails to initialize
        logger.error('Startup failed:', err);
        console.error('❌ Startup failed:', err);
        // Exit with error code to notify process manager of failure
        process.exit(1);
    }
})();