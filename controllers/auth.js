const asyncHandler = require('../middlewares/async');
const authService = require('../services/auth');
const User = require('../models/User');
const ErrorResponse = require("../utils/errorResponse");
const jwt = require('jsonwebtoken');

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

    let newUser = await User.createUser(user);

    const token = signToken(newUser.id, newUser.role, newUser.email);

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

    console.log('The token')
    console.log(typeof newToken);

    let user = await User.getUserByEmail(email);

    let authTokens = user.authTokens.push({newToken});

    let newUser = await User.findByIdAndUpdate(user.id, {authToken: authTokens}, {new: true}).then(updatedUser => {
        console.log('Updated User')
        console.log(updatedUser)
    }).catch(err => {
        console.log(err)
    })

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