const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

module.exports.login = async (email, password) => {
  if (!email) {
    throw new ErrorResponse('Please provide an email', 400);
  }
  if (!password) {
    throw new ErrorResponse('Please provide a password', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password')
    .setOptions({ sanitizeFilter: true });

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const isMatch = await user.correctPassword(password);

  if (!isMatch) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  const { token } = await user.getSignedJwtToken();

  const response = {
    authToken: token,
    email: user.email,
    role: user.role,
  };

  return response;
};

module.exports.logout = async (userId, token) => {
  if (!userId) {
    throw new ErrorResponse('Please provide user id', 400);
  }
  if (!token) {
    throw new ErrorResponse('Please provide an auth token', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const oldUserTokensLength = user.authTokens.length;
  user.authTokens = user.authTokens.filter((t) => t.token !== token);
  const newUser = await user.save();

  if (newUser.authTokens.length === oldUserTokensLength) {
    throw new ErrorResponse('Token cannot be removed', 401);
  }
};

module.exports.register = async (email, password) => {
  if (!email) {
    throw new ErrorResponse('Please provide an email', 400);
  }
  if (!password) {
    throw new ErrorResponse('Please provide a password', 400);
  }

  const existingUser = await User.findOne({
    email: email.toLowerCase(),
  }).setOptions({
    sanitizeFilter: true,
  });

  if (existingUser) {
    throw new ErrorResponse('User already registered', 403);
  }

  const user = await User.create({
    email: email.toLowerCase(),
    password,
  });

  const { token } = await user.getSignedJwtToken();
  const response = {
    authToken: token,
    email: user.email,
    role: user.role,
  };

  return response;
};

module.exports.resetPassword = async (email) => {
  const user = await User.findOneAndUpdate(
    { email },
    { resetPassword: true },
    { new: true }
  ).setOptions({ sanitizeFilter: true });

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const otp = await user.generateOTP();

  user.otp = otp;
  await user.save();

  // email / sms flow for sending otp to the user
  // until then it will be sended in the response for dev purposes

  return otp;
};

module.exports.createPassword = async (otp, password) => {
  const user = await User.findOne({
    otp,
    resetPassword: true,
  }).setOptions({ sanitizeFilter: true });

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const verified = await user.verifyOTP(otp);
  if (!verified) {
    throw new ErrorResponse('Invalid token provided', 403);
  }

  user.resetPassword = undefined;
  user.otp = undefined;
  user.twoFactorSecret = undefined;
  user.authTokens = [];

  user.password = password;

  await user.save();

  const { token } = await user.getSignedJwtToken();

  const response = {
    authToken: token,
    email: user.email,
    role: user.role,
  };

  return response;
};

module.exports.changePassword = async (oldPassword, newPassword, userId) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  if (oldPassword === newPassword) {
    throw new ErrorResponse(
      'New password cannot be the same as your old password',
      400
    );
  }

  const oldPasswordChecked = await user.validPassword(oldPassword);

  if (!oldPasswordChecked) {
    throw new ErrorResponse('Old password incorrect', 400);
  }

  user.password = newPassword;
  await user.save();
};

module.exports.me = async (userId) => {
  const user = await User.findById(userId).select('email role image createdAt');

  return user;
};
