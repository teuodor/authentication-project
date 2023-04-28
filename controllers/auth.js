const asyncHandler = require('../middlewares/async');
const authService = require('../services/auth');
const User = require('../models/User');
const ErrorResponse = require("../utils/errorResponse");
const jwt = require('jsonwebtoken');

module.exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.getUserByEmail(email)

    if (!user) {
        throw new ErrorResponse('User not found', 404);
    }

    const passwordIsCorrect = await User.correctPassword(password, user.password);

    if (!passwordIsCorrect) {
        throw new ErrorResponse('Invalid credentials', 401);
    }

    const token = await signToken(user.id, user.role, user.email);

    res.status(200).json({
      success: true,
      data: {
        authToken: token,
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
    let emailExists = await User.checkEmailExists(req.body.email);

    if(emailExists){
        return next(new ErrorResponse('Email is already used', 400));
    }

    req.body.email = req.body.email.toLowerCase()
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

    let newUser = await User.createUser(user);

    const token = await signToken(newUser.id, newUser.role, newUser.email);

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

const signToken = async (id, role, email) => {
    //TODO temporary solution

    let newToken = await jwt.sign({id, role, email}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });


    let user = await User.getUserByEmail(email);
    console.log(user);
    let authTokens = user.authTokens;
    authTokens.push({token: newToken})

    let newUser = await User.findByIdAndUpdate(user.id, {authTokens: authTokens});

    return newToken;
};

const createSendToken = (user, statusCode, res, ...tempUrl) => {
    const token = signToken(user._id);

    //TODO to be discussed

    // const cookieOptions = {
    //     expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    //     httpOnly: true
    // }
    //
    // //Remove password from output
    // user.password = undefined;
    //
    // if(process.env.NODE_ENV === 'production') cookieOptions.secure = true
    //
    // res.cookie('jwt', token, cookieOptions)

    return token;
}