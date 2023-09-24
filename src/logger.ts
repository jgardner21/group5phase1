import winston from 'winston'
import checkEnvFile from './check_env';


var log_level = 'warn'; //Default, doesn't matter bc it only doesn't change when logging is set to silent
var is_silent = false;

try {
    checkEnvFile()
}
catch(err) {
    process.exitCode = 1
    throw err
}

if(process.env.hasOwnProperty("LOG_LEVEL")) {
    if(process.env.LOG_LEVEL == '1') {
        log_level = 'info'
    }
    else if(process.env.LOG_LEVEL == '2') {
        log_level = 'debug'
    }
    else {
        is_silent = true;
    }
}
else {
    is_silent = true;
}

const loggingFormat = winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} | [Level = ${level}]: ${message}`;
    });

const logger = winston.createLogger({
    level: log_level,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        loggingFormat
        ),
    transports: new winston.transports.File({ filename: process.env.LOG_FILE }),
    silent: is_silent
})

logger.info("Winston logger running")

export default logger