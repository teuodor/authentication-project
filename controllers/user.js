const asyncHandler = require('../middlewares/async');
const decodeToken = require('../utils/decodeToken');
const authService = require('../services/auth');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const uploadFeatures = require('../utils/upload');
const userFeatures = require('./../utils/users');
const jwt = require('jsonwebtoken');
const log = require('../utils/logsChalk');
const path = require('path');

exports.uploadUserPhoto = asyncHandler(async (req, res, next) => {
  let userId = req.user.id;

  // check if only one file is uploaded and is named photo
  if (!req.files || Object.keys(req.files).length !== 1 || !req.files.photo) {
    return next(new ErrorResponse('Please upload one photo', 400));
  }

  const userPhoto = req.files.photo;
  const fileExtension = path.extname(userPhoto.name);

  const acceptedExtensions = ['.jpg', '.jpeg', '.png'];
  if (!acceptedExtensions.includes(fileExtension)) {
    return next(
      new ErrorResponse(
        'Invalid file type. Please upload a photo with .jpg .jpeg or .png format.',
        400
      )
    );
  }

  let photoPath = await uploadFeatures.uploadProfilePicture(
    req,
    res,
    next,
    userId
  );
  await User.changePhoto(userId, photoPath);

  res.status(200).json({
    status: 'success',
    message: 'User photo uploaded successfully',
    path: photoPath,
  });
});

module.exports.getAll = asyncHandler(async (req, res, next) => {
  const users = await User.getAllUsers();
  res.status(200).json({
    success: true,
    data: {
      users: users.map((user) => user.toObject()),
    },
  });
});

module.exports.me = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      ...user.toObject(),
    },
  });
});
