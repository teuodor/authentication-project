const asyncHandler = require('../middlewares/async');
const decodeToken = require('../utils/decodeToken');
const authService = require('../services/auth');
const User = require('../models/User');
const ErrorResponse = require("../utils/errorResponse");
const uploadFeatures = require("../utils/upload");
const userFeatures = require("./../utils/users");
const jwt = require('jsonwebtoken');
const log = require("../utils/logsChalk");

exports.uploadUserPhoto = asyncHandler(async (req, res, next) => {
    let userId = req.user.id;
    // let fileName = userFeatures.generatePassword(3);

    let photoPath = await uploadFeatures.uploadProfilePicture(req, res, next, userId)
    await User.changePhoto(userId, photoPath);

    res.status(200).json({
        status: 'success',
        message: 'User photo uploaded successfully',
        path: photoPath
    });

})

module.exports.allUsers = asyncHandler(async (req, res, next) => {
    const users = await User.getAllUsers();
    res.status(200).json({
        success: true,
        data: {
            users
        },
    });
})

module.exports.me = asyncHandler(async (req, res, next) => {
    const response = await User.getUserByUserId(req.user.id);

    res.status(200).json({
        success: true,
        data: {
            response
        },
    });
});