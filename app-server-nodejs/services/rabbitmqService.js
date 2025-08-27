// RabbitMQ Service Module
// This module provides functionality to interact with RabbitMQ message broker
// for asynchronous processing of PDF document processing jobs.
const amqp = require('amqplib'); // Import the AMQP library for RabbitMQ communication
const { config } = require('../config'); // Import application configuration
const { logger } = require('../utils/logger'); // Import logging utility

// Channel object that will be initialized when connecting to RabbitMQ
// and reused for subsequent operations
let channel;

/**
 * Initializes the connection to RabbitMQ and creates a channel
 * This should be called during application startup
 */
async function initRabbitMQ() {
    // Establish connection to RabbitMQ server using URL from config
    const connection = await amqp.connect(config.rabbitmq.url);

    // Create a channel for communication
    channel = await connection.createChannel();

    // Ensure the queue exists (creates it if it doesn't)
    // Setting durable: true ensures that the queue survives broker restarts
    await channel.assertQueue(config.rabbitmq.queue, { durable: true });

    logger.info('RabbitMQ connected');
}

/**
 * Publishes a document processing job to the queue
 * @param {Object} jobData - The job data to be processed
 * @param {string} jobData.jobId - Unique identifier for the job
 */
async function publishProcessingJob(jobData) {
    // Verify that the RabbitMQ connection is established before proceeding
    if (!channel) throw new Error('RabbitMQ channel not initialized');

    // Convert job data to JSON string and then to Buffer before sending
    // Setting persistent: true ensures messages survive broker restarts
    channel.sendToQueue(config.rabbitmq.queue, Buffer.from(JSON.stringify(jobData)), { persistent: true });

    logger.info(`Published job: ${jobData.jobId}`);
}

/**
 * Closes the RabbitMQ channel
 * Should be called during graceful application shutdown
 */
async function closeRabbitMQ() {
    if (channel) await channel.close();
}

// Export the functions to be used by other modules
module.exports = { initRabbitMQ, publishProcessingJob, closeRabbitMQ };
