// MinioService.js - Handles all PDF file uploads to MinIO object storage
// This service provides methods to initialize the MinIO connection and upload files to the configured bucket
const Minio = require('minio');
const { config } = require('../config');
// const { logger } = require('../utils/logger');

// Initialize MinIO client with configuration from the config file
// - endPoint: The host name of the MinIO server
// - port: The port number to connect to
// - useSSL: Whether to use secure SSL connection
// - accessKey: Access key (username) for MinIO server
// - secretKey: Secret key (password) for MinIO server
const minioClient = new Minio.Client({
    endPoint: config.minio.endpoint,
    port: config.minio.port,
    useSSL: config.minio.useSSL,
    accessKey: config.minio.accessKey,
    secretKey: config.minio.secretKey,
});

/**
 * Initializes MinIO by checking if the configured bucket exists and creates it if it doesn't
 * This ensures the application has a valid storage location before attempting uploads
 * @returns {Promise<void>}
 */
async function initMinio() {
    console.log('[MINIO] Checking if bucket exists:', config.minio.bucket);
    const exists = await minioClient.bucketExists(config.minio.bucket);
    if (!exists) {
        console.log('[MINIO] Bucket does not exist, creating:', config.minio.bucket);
        await minioClient.makeBucket(config.minio.bucket);
        console.log('[MINIO] Bucket created successfully');
    } else {
        console.log('[MINIO] Bucket already exists:', config.minio.bucket);
    }
}

/**
 * Uploads a file to the MinIO bucket
 * @param {Object} file - The file object from multer middleware
 * @param {Buffer} file.buffer - The file content as a buffer
 * @param {number} file.size - The size of the file in bytes
 * @param {string} file.mimetype - The MIME type of the file
 * @returns {Promise<string>} - The object name (path) of the uploaded file
 */
async function uploadFile(file) {
    // Generate a unique filename using timestamp and random string to prevent collisions
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;

    // Set the object path/name within the bucket
    // Using 'uploads/' prefix for better organization
    const objectName = `uploads/${fileName}`;

    console.log('[MINIO] Uploading file:', objectName);

    // Upload the file to MinIO
    // Parameters: bucket name, object name, file buffer, file size, and metadata (content type)
    await minioClient.putObject(config.minio.bucket, objectName, file.buffer, file.size, { 'Content-Type': file.mimetype });

    console.log('[MINIO] File uploaded successfully:', objectName);

    // Return the object name for future reference (can be used to generate download URLs)
    return objectName;
}

async function uploadStream(minioPath, stream, mimetype) {
    try {
        // MinIO needs the size; if unknown, you can buffer or use a temp file, or use a workaround for unknown size
        // Here, we buffer to count size (for production, use a temp file or multipart upload for large files)
        const chunks = [];
        let size = 0;
        for await (const chunk of stream) {
            chunks.push(chunk);
            size += chunk.length;
        }
        const buffer = Buffer.concat(chunks);

        console.log('[MINIO] Uploading file:', minioPath);
        await minioClient.putObject(config.minio.bucket, minioPath, buffer, size, { 'Content-Type': mimetype });
        console.log('[MINIO] File uploaded successfully:', minioPath);
        return { size };
    } catch (err) {
        console.error('Error uploading stream to MinIO:', err);
        throw err;
    }
}

module.exports = { initMinio, uploadFile, uploadStream };
