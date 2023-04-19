const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');

const roles = require('../constants/roles');
const { IMAGE } = require('../constants/user');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,64}/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
      match: [
        /^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^\w\d]).*$/,
        'Please add a valid password',
      ],
    },
    authTokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    role: {
      type: String,
      enum: [roles.ADMIN, roles.USER],
      default: roles.USER,
      required: true,
    },
    image: { type: String, default: IMAGE },
    otp: { type: String },
    twoFactorSecret: String,
    resetPassword: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  await this.savePassword(this.password);
});

UserSchema.methods.savePassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(password, salt);
};

UserSchema.methods.validPassword = async function (candidatePassword) {
  const result = await bcrypt.compare(candidatePassword, this.password);
  return result;
};

UserSchema.methods.getSignedJwtToken = async function () {
  const token = jwt.sign(
    { id: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );

  this.authTokens = this.authTokens.concat({ token });
  await this.save();

  return { token };
};

UserSchema.methods.generateOTP = async function () {
  const secret = speakeasy.generateSecret();

  this.twoFactorSecret = secret.base32;
  await this.save();

  const token = speakeasy.totp({
    secret: this.twoFactorSecret,
    encoding: 'base32',
    time: 7200,
  });

  return token;
};

UserSchema.methods.verifyOTP = async function (otp) {
  return speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: 'base32',
    token: otp,
    window: 2,
    time: 7200,
  });
};

module.exports = mongoose.model('User', UserSchema);
