const asyncHandler = require('../middlewares/async');
const authService = require('../services/auth');

module.exports.login = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const response = await authService.login(email, password);

    res.status(200).json({
      success: true,
      data: {
        authToken: response.authToken,
        email: response.email,
        role: response.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports.logout = asyncHandler(async (req, res, next) => {
  try {
    await authService.logout(
      req.userId,
      req.headers.authorization.split(' ')[1]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports.register = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const response = await authService.register(email, password);

    res.status(201).json({
      success: true,
      data: {
        authToken: response.authToken,
        email: response.email,
        role: response.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports.resetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;

    const response = await authService.resetPassword(email);

    res.status(200).json({
      success: true,
      otp: response,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports.createPassword = asyncHandler(async (req, res, next) => {
  try {
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
  } catch (error) {
    return next(error);
  }
});

module.exports.changePassword = asyncHandler(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    await authService.changePassword(oldPassword, newPassword, req.userId);

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports.me = asyncHandler(async (req, res, next) => {
  try {
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
  } catch (error) {
    return next(error);
  }
});
