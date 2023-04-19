class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  toString() {
    return `status code: ${this.statusCode}, message: ${this.message}`;
  }
}

module.exports = ErrorResponse;
