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

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else {
    next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;

    const loggedInUser = await User.findById(req.userId);
    if (loggedInUser.authTokens.some((tkn) => tkn.token === token)) {
      next();
    } else {
      next(new ErrorResponse('Not authorized to access this route', 401));
    }
  } catch (error) {
    next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

module.exports.authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.userRole;
    if (userRole && roles.includes(userRole)) {
      next();
    }
  };
};
