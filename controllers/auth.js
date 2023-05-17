const jwt = require('jsonwebtoken');
const asyncHandler = require('../middlewares/async');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const {
  generateResetPasswordHtml,
  generateActivateUserHtml,
} = require('../utils/generateHtml');

module.exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if(!email || !password){
    throw new ErrorResponse('Invalid email or password', 401);
  }

  const user = await User.getByEmail(email, true, true, true, false);

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const passwordIsCorrect = await User.correctPassword(password, user.password);

  if (!passwordIsCorrect) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  const checkActiveUser = await user.checkActive();
  if (!checkActiveUser) {
    throw new ErrorResponse('Not active, please activate first', 400);
  }

  const authToken = await user.getAuthToken();
  const responseUser = user.toObject();
  const properties = [
    'authTokens',
    'password',
    'active',
    'lastActivationRequest',
  ];

  for (let i = 0; i < properties.length; i++) {
    responseUser[properties[i]] = undefined;
  }

  res.status(200).json({
    success: true,
    data: {
      ...responseUser,
      authToken,
    },
  });
});

module.exports.logout = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const authToken = req.headers.authorization.split(' ')[1];

  const user = await User.getById(userId, false, true);

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
  let email = req.body.email;

  if (!email) {
    return next(new ErrorResponse('Provide an email', 400));
  }

  email = req.body.email.toLowerCase();

  let emailExists = await User.checkEmailExists(email);

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
  for (let i = 0; i < allowedFields.length; i++) {
    user[allowedFields[i]] = req.body[allowedFields[i]];
  }

  let newUser = await User.createUser(user);

  const token = await newUser.getSignedJwtToken();

  const urlToActivate = process.env.HOST + '/auth/activate/' + token;
  await sendEmail({
    email: email,
    subject: 'Activate user request',
    message: `Activate user link: ${urlToActivate}`,
    html: generateActivateUserHtml(urlToActivate),
  });

  let data= {
        user: newUser
  };

  if(process.env.NODE_ENV === 'testing'){
    data.urlToActivate = urlToActivate;
    data.tokenToActivate = token
  }

  res.status(201).json({
    success: true,
    data: data
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
    html: generateResetPasswordHtml(otp),
  });

  res.status(200).json({
    success: true,
  });
});

module.exports.createPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  const user = await User.getForCreatingPassword(token);
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

  const authToken = await user.getAuthToken();
  const responseUser = user.toObject();
  const properties = ['authTokens', 'password'];

  for (let i = 0; i < properties.length; i++) {
    responseUser[properties[i]] = undefined;
  }

  res.status(200).json({
    success: true,
    data: {
      ...responseUser,
      authToken,
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

module.exports.activate = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  if (!token) {
    res.sendFile(path.join(__dirname, '../static/activateError.html'));
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      res.sendFile(path.join(__dirname, '../static/activateError.html'));
    } else {
      const user = await User.getById(decoded.id, false, false, true, true);
      if (!user || user.active) {
        res.sendFile(path.join(__dirname, '../static/activateError.html'));
        return;
      }

      await user.activate();
      res.sendFile(path.join(__dirname, '../static/activateSuccess.html'));
    }
  });
});

module.exports.resendActivationUrl = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.getByEmail(email, false, false, false, true);
  let responseMessage= 'You should receive an activation URL if there is an account with this email.'

  if (!user) {
    res.status(200).json({
      success: true,
      responseMessage
    });
    return;
  }

  if (user.lastActivationRequest) {
    const lastActivationDateInMinutes = Math.floor(
      (Date.now() - user.lastActivationRequest) / (1000 * 60)
    );
    if (lastActivationDateInMinutes < 5) {
      throw new ErrorResponse(
        `You already requested a new activation link less than 5 minutes ago`,
        401
      );
    }
  }

  const token = await user.getSignedJwtToken();
  const urlToActivate = process.env.HOST + '/auth/activate/' + token;

  await sendEmail({
    email: email,
    subject: 'Activate user request',
    message: `Activate user link: ${urlToActivate}`,
    html: generateActivateUserHtml(urlToActivate),
  });
  await user.setLastActivationRequest();

  res.status(200).json({
    success: true,
    urlToActivate,
  });
});
