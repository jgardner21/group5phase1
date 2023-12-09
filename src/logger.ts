import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import AWS from 'aws-sdk';

// AWS configuration
AWS.config.update({
    region: 'us-east-2'
});

// Common logging format
const loggingFormat = winston.format.printf(({timestamp, level, message}) => {
    return `${timestamp} | [Level = ${level}]: ${message}`;
});

// Create single transport for all logs
const cloudWatchTransport = new WinstonCloudWatch({
    logGroupName: 'appLogs',
    logStreamName: 'winston',
    awsRegion: 'us-east-2',
    level: 'debug',
    errorHandler: function (err) {
        console.error('Error logging to CloudWatch:', err);
    },
    uploadRate: 5000 // Adjusted upload rate (5 seconds)
});

// Logger configuration
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        loggingFormat
    ),
    transports: [cloudWatchTransport],
    exceptionHandlers: [cloudWatchTransport]
});

logger.info("Winston logger running");

export default logger;