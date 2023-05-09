const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { createLogger, transports, format } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logDir = process.argv[2]

const getLatestLogFilePath = () => {
    const currentDate = moment().format('YYYY-MM-DD');
    const logFilePath = path.join(logDir, `${currentDate}.log`);

    if (fs.existsSync(logFilePath)) {
        return logFilePath;
    }

    const files = fs.readdirSync(logDir);

    for (let i = files.length - 1; i >= 0; i--) {
        const file = files[i];

        if (file.endsWith('.log')) {
            return path.join(logDir, file);
        }
    }

    return null;
};

const readLogFile = () => {
    const filePath = getLatestLogFilePath();

    if (!filePath) {
        console.error('No log files found');
        return;
    }

    let fileContent = fs.readFileSync(filePath, 'utf-8');


    if (logDir.includes('requests')){
        let requestsFormat = ''
        fileContent = JSON.parse(fileContent);

        fileContent.map(log => {
            requestsFormat += `[Status: ${log.errorStatus}] - Message: ${log.message} - Params: ${log.requestParams} - Body: ${log.requestBody} \n`
        })
        console.log(requestsFormat)
    }else{
        console.log(fileContent);
    }
};

// watch for changes in the log file
fs.watch(logDir, (event, filename) => {
    if (filename.endsWith('.log')) {
        console.log(`Log file ${filename} changed`);
        readLogFile();
    }
});


readLogFile();