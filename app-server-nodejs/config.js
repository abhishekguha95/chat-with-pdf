/**
 * Main configuration file for the chat-with-pdf application
 * 
 * This file centralizes all configuration with sensible defaults
 * while allowing overrides through environment variables.
 */
require('dotenv').config();

// Environment detection
const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
// const isTest = environment === 'test';

// Centralized configuration object
const config = {
    // Basic server configuration
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: environment,

    // Database settings
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chatpdf'
    },

    // MinIO object storage settings
    minio: {
        endpoint: process.env.MINIO_ENDPOINT || 'minio',
        port: parseInt(process.env.MINIO_PORT || '9000', 10),
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
        bucket: process.env.MINIO_BUCKET || 'pdf-documents',
        useSSL: process.env.MINIO_USE_SSL === 'true',
    },

    // RabbitMQ message queue settings
    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
        queue: process.env.RABBITMQ_QUEUE || 'pdf_jobs',
    },

    // gRPC service settings
    grpc: {
        chatServiceHost: process.env.CHAT_SERVICE_HOST || 'localhost:50051',
    },

    // File upload settings
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB
        allowedMimeTypes: ['application/pdf'],
    },

    // Rate limiting settings
    rateLimit: {
        // More generous in development, stricter in production
        windowMs: isProduction ? 5 * 60 * 1000 : 15 * 60 * 1000,
        max: isProduction ? 50 : 1000,
    },
};

module.exports = { config };
