const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');
const User = require('../models/User');
const decodeToken = require("../utils/decodeToken");
const log = require('../utils/logsChalk')


module.exports.access = (req, res, next) => {
  const accessKey = process.env.ACCESS_KEY;

  if (!req.headers['x-api-key'] || req.headers['x-api-key'] !== accessKey) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  if (req.headers['x-api-key'] == accessKey) next();
};

module.exports.protect = asyncHandler(async (req, res, next) => {

  let decoded = await decodeToken(req, res, next);
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
  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  }
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