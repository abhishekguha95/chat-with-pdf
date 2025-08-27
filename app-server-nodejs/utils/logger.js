// Simple winston logger with color and metadata
const winston = require('winston');
const { config } = require('../config');
const logLevel = config.nodeEnv === 'production' ? 'info' : 'debug';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'app-server-nodejs' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

module.exports = { logger };
