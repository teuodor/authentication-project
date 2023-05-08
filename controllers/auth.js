const jwt = require('jsonwebtoken');
const asyncHandler = require('../middlewares/async');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const { formatUser } = require('../utils/formatters');

module.exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.getByEmail(email);

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const passwordIsCorrect = await User.correctPassword(password, user.password);

  if (!passwordIsCorrect) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  const authToken = await user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    data: {
      user: { ...formatUser(user), authToken },
    },
  });
});

module.exports.logout = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const authToken = req.headers.authorization.split(' ')[1];

  const user = await User.getById(userId);

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }
  const authTokensLength = user.authTokens.length;

  const newUser = await user.filterAuthTokens(authToken);

  if (authTokensLength === newUser.authTokens.length) {
    throw new ErrorResponse('Token cannot be removed', 401);
  }

  res.status(200).json({ success: true });
});

module.exports.register = asyncHandler(async (req, res, next) => {
  if (!req.body.email) {
    return next(new ErrorResponse('Provide an email', 400));
  }

  req.body.email = req.body.email.toLowerCase();

  let emailExists = await User.checkEmailExists(req.body.email);

  if (emailExists) {
    return next(new ErrorResponse('Email is already used', 400));
  }

  //This allowedField functionality will be useful when we will have more fields
  const allowedFields = ['username', 'email', 'password'];

  // create users with default fields
  let user = {
    image: null,
    role: 'user',
    otp: null,
    authTokens: [],
  };
  // add fields from request body
  allowedFields.forEach((field) => {
    user[field] = req.body[field];
  });

  let newUser = await User.createUser(user);
  newUser.photo = 'path/myFile.png';

  const authToken = await newUser.getSignedJwtToken();

  res.status(201).json({
    success: true,
    data: {
      user: { ...formatUser(newUser), authToken },
    },
  });
});

module.exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.getByFieldAndUpdate(
    { email },
    { resetPassword: true }
  );

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const otp = await user.generateOTP();

  // email / sms flow for sending otp to the user
  // until then it will be sended in the response for dev purposes

  await sendEmail({
    email: email,
    subject: 'Reset password request',
    message: `Token: ${otp}`,
    otp,
  });

  res.status(200).json({
    success: true,
  });
});

module.exports.createPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  const user = await User.getByFields(
    { otp: token, resetPassword: true },
    true
  );
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const verified = await user.verifyOTP(token);
  if (!verified) {
    throw new ErrorResponse('Invalid token provided', 403);
  }

  user.resetPassword = undefined;
  user.otp = undefined;
  user.twoFactorSecret = undefined;
  user.authTokens = [];

  user.password = password;

  await user.save();

  const authToken = await user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    data: {
      authToken,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports.changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.getById(req.user.id, true);

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  if (oldPassword === newPassword) {
    throw new ErrorResponse(
      'New password cannot be the same as your old password',
      400
    );
  }

  const oldPasswordChecked = await User.correctPassword(
    oldPassword,
    user.password
  );

  if (!oldPasswordChecked) {
    throw new ErrorResponse('Old password incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
  });
});

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
};
