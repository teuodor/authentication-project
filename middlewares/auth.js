const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');
const User = require('../models/User');

module.exports.access = (req, res, next) => {
  const accessKey = process.env.ACCESS_KEY;

  if (!req.headers['x-api-key'] || req.headers['x-api-key'] !== accessKey) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  if (req.headers['x-api-key'] == accessKey) next();
};

module.exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('You are not logged in!', 401));
  }

  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  if(!decoded){
    return next(new ErrorResponse('Token invalid or something went wrong.', 401));
  }

  // Check if users exist
  const currentUser = await User.checkUserIdExists(decoded.id);
  if (!currentUser) {
    return next(new ErrorResponse('The user no longer exist', 401));
  }

  //TODO check if current user is active

  // if(!currentUser['active']){
  //   return next(new ErrorResponse('User is disabled', 401));
  // }

  //The current user details are now stored in the request object
  req.user = currentUser
  next()
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      return next(new ErrorResponse('You don\'t have access here', 403));
    }
    next();
  };
};

module.exports.authorizeTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse('You don\'t have access here', 403));
    }
    next();
  };
};