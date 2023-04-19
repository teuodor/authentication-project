const errorHandler = (err, req, res, next) => {
  console.log(err.toString());

  res.status(err.statusCode).json({
    success: false,
    error: err.message,
  });
};

module.exports = errorHandler;
