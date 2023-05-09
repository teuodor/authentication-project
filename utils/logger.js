const {createLogger, transports, format} = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
require('winston-mongodb');
const CustomTransport = require('./customTransport');

const logger = createLogger({
    levels: {
        'info': 0,
        'ok': 1,
        'error': 2,
        'requestsLevel': 3,
    },
    transports: [
        new DailyRotateFile({
            filename: 'logs/requests/requestsLogs-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: false,
            gzip: false,
            maxSize: '1m',
            maxFiles: '7d',
            level: 'requestsLevel',

        }),
        new CustomTransport({
            filename: 'logs/requests/requestsLogs.log',
            level: 'requestsLevel',
            handleExceptions: true,
            maxsize: '1m',
            format: format.combine(format.timestamp()),
            filters: [function (level, msg, meta) {
                return (level === 'requestsLevel') ? msg : '';
            }],
        }),
    ],
    meta: true
});

module.exports = logger;