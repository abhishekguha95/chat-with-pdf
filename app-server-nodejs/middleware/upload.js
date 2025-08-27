// Multer config for PDF uploads to memory
const multer = require('multer');
const { config } = require('../config');

/**
 * Configure multer to store uploaded files in memory
 * This avoids writing files to disk and keeps them available in req.file.buffer
 */
const storage = multer.memoryStorage();

/**
 * Configured multer middleware for handling PDF file uploads
 * - Uses memory storage to keep files in RAM
 * - Limits file size according to application configuration
 * - Filters files to ensure only PDFs are accepted
 */
module.exports = multer({
    storage, // Use the memory storage configuration
    limits: {
        fileSize: config.upload.maxFileSize // Restrict file size based on app config
    },
    fileFilter: (req, file, cb) => {
        // Check if the uploaded file's MIME type is in the list of allowed types
        if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
            // Accept the file if it's an allowed type
            cb(null, true);
        } else {
            // Reject the file with an error if it's not an allowed type
            cb(new Error('Only PDF files are allowed'));
        }
    }
});
