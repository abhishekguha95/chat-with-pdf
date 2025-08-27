// Sets up the Node.js gRPC client to stream chat responses from Python backend

/**
 * Required dependencies:
 * - grpc-js: Core gRPC library for Node.js client-server communication
 * - protoLoader: Utility to load and parse Protocol Buffer definitions
 * - path: Node.js path module for handling file paths
 * - config: Application configuration containing gRPC server settings
 */
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { config } = require('../config');
const { logger } = require('../utils/logger');

// Path to the Protocol Buffer definition file that defines our service interface
const PROTO_PATH = path.resolve(__dirname, '../proto/chat.proto');

/**
 * Load and parse the Protocol Buffer definition
 * Options:
 * - keepCase: Preserves field casing instead of converting to camel case
 * - longs: Represents 64-bit numbers as strings instead of objects
 * - enums: Represents enums as strings instead of numbers
 * - defaults: Sets default values for missing fields
 * - oneofs: Sets up virtual oneof properties
 */
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });

// Extract the chat service definition from the loaded proto file
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

// Shared client instance
let chatClient;

/**
 * Initializes the gRPC client to connect to the Python backend
 * This should be called during application startup
 */
function initGRPC() {
    try {
        // Create a client instance connecting to the specified host
        // In production, you should use secure credentials
        const serverAddress = config.grpc.chatServiceHost;

        logger.info(`Initializing gRPC client connection to ${serverAddress}`);

        chatClient = new chatProto.ChatService(
            serverAddress,
            // For development, using insecure credentials is acceptable
            // For production, implement proper TLS certificates
            grpc.credentials.createInsecure()
        );

        // Optional: Test the connection by making a simple call
        // This can help ensure the gRPC server is actually available
        chatClient.waitForReady(Date.now() + 5000, (error) => {
            if (error) {
                logger.warn(`gRPC server not ready: ${error.message}`);
            } else {
                logger.info('gRPC client successfully connected to server');
            }
        });

        logger.info('gRPC client initialized');
    } catch (error) {
        logger.error('Failed to initialize gRPC client', error);
        // We don't throw the error here to allow the application to start
        // even if the gRPC server is not available yet
    }
}

/**
 * Returns the initialized gRPC client
 * @returns {Object} The gRPC client object
 */
function getClient() {
    if (!chatClient) {
        logger.warn('gRPC client accessed before initialization');
        // Auto-initialize if not already done
        initGRPC();
    }
    return chatClient;
}

/**
 * Shuts down the gRPC client connection
 * Should be called during application shutdown
 */
function closeGRPC() {
    if (chatClient) {
        // Note: grpc-js doesn't have an explicit close method
        // The channel will be automatically closed when garbage collected
        // But we can help by removing our reference
        chatClient = null;
        logger.info('gRPC client reference released');
    }
}

/**
 * Streams chat responses from the Python backend using gRPC
 * 
 * @param {Object} params - The parameters for the chat request
 * @param {string} params.message - The user's current message to be processed
 * @param {string} params.projectId - Identifier for the current project/document context
 * @param {Array} params.chatHistory - Previous messages in the conversation for context
 * @returns {Object} - A gRPC stream that emits responses from the Python backend
 */
function streamChat({ message, projectId, chatHistory }) {
    // Use gRPC native streaming API to get responses as a stream
    // The returned object is a readable stream that emits data events
    return chatClient.StreamChat({
        message,
        project_id: projectId,
        user_id: '', // Currently not used, but reserved for future user identification
        chat_history: chatHistory || [], // Provide conversation context or default to empty array
    });
}

module.exports = {
    initGRPC,
    getClient,
    closeGRPC,
    streamChat
};
