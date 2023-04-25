const asyncHandler = require('../middlewares/async');
const authService = require('../services/auth');
const User = require('../models/User');
const ErrorResponse = require("../utils/errorResponse");

module.exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const response = await authService.login(email, password);

    //TODO continue here @Marian
    const user = await User.findOne({email}).select('+password');

    res.status(200).json({
      success: true,
      data: {
        authToken: response.authToken,
        email: response.email,
        role: response.role,
      },
    });
});

module.exports.logout = asyncHandler(async (req, res, next) => {
    await authService.logout(
      req.userId,
      req.headers.authorization.split(' ')[1]
    );

    res.status(200).json({ success: true });
});

module.exports.register = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    let emailExists = await User.checkEmailExists(req.body.email);

    if(emailExists){
        return next(new ErrorResponse('Username or email is already used', 400));
    }

    //This allowedField functionality will be useful when we will have more fields
    const allowedFields = ['username', 'email', 'password'];

    // create users with default fields
    let user = {
        image: null,
        role: 'user',
        otp: null,
        authTokens: []
    }
    // add fields from request body
    allowedFields.forEach(field => {
        user[field] = req.body[field]
    })

    let newUser = await User.create();
    if(!!newUser){
        return next(new ErrorResponse('Something went wrong', 500));
    }

    const {token} = await User.getSignedJwtToken();

    res.status(201).json({
      success: true,
      data: {
        authToken: token,
        newUser
      },
    });
});

module.exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const response = await authService.resetPassword(email);

    res.status(200).json({
      success: true,
      otp: response,
    });
});

module.exports.createPassword = asyncHandler(async (req, res, next) => {
    const { token, password } = req.body;

    const response = await authService.createPassword(token, password);

    res.status(200).json({
      success: true,
      data: {
        authToken: response.authToken,
        email: response.email,
        role: response.role,
      },
    });
});

module.exports.changePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    await authService.changePassword(oldPassword, newPassword, req.userId);

    res.status(200).json({
      success: true,
    });
});

module.exports.me = asyncHandler(async (req, res, next) => {
    const response = await authService.me(req.userId);

    res.status(200).json({
      success: true,
      data: {
        email: response.email,
        role: response.role,
        image: response.image,
        createdAt: response.createdAt,
      },
    });
});
