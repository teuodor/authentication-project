const logger = require("../utils/logger");

class ErrorResponse extends Error{
  constructor(message, statusCode, req = null, user = null) {

    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    if(req !== null){
      let requestBody= JSON.stringify(req.body);
      let requestParams= JSON.stringify(req.params);

      let logMessage = {
        errorStatus: statusCode,
        requestBody: requestBody,
        requestParams: requestParams,
        user: user
      }
      // logger.log('error', JSON.stringify(logMessage), 'test');
      logger.error(this.message, logMessage);
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;