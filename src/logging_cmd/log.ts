/*
    set up from: 
    https://www.npmjs.com/package/winston#creating-your-own-logger

    logging levels
    $LOG_FILE
    $LOG_LEVEL
    0 means silent, 1 means informational messages, 2 means debug messages
*/
import winston from 'winston';

//find level
var log_level:string | undefined = process.env.LOG_LEVEL //need to initialize to default value, type string|undefined
//compare numbers
if(Number(process.env.LOG_LEVEL) == 0){ 
    log_level = 'silent';
}
else if(Number(process.env.LOG_LEVEL) == 1){
    log_level = 'info';
}
else if(Number(process.env.LOG_LEVEL) == 2){
    log_level = 'debug';
}

export const logger = winston.createLogger({
    level: log_level,
    format: winston.format.json(),
    defaultMeta: {service: 'Group 5 Phase 1'},
    transports: [
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

