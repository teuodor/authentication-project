const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const validator = require('validator');

const roles = require('../constants/roles');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      validate: [validator.isEmail, 'Please fill a valid email address']
    },
    password: {
      type: String,
      minlength: [8, 'Password is too short'],
      select: false,
      match: [
        /^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^\w\d]).*$/,
        'Please add a valid password',
      ],
    },
    authTokens: { type: [String], select: false },
    role: {
      type: String,
      enum: [roles.ADMIN, roles.USER],
      default: roles.USER,
      required: true,
    },
    photo: { type: String, default: null },
    otp: { type: String, select: false },
    twoFactorSecret: { type: String, select: false },
    resetPassword: {
      type: Boolean,
      default: false,
      select: false,
    },
    active: {
      type: Boolean,
      default: false,
      select: false,
    },
    lastActivationRequest: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true, versionKey: false }
);

//Mongoose hooks
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  await this.setPassword(this.password);
  next();
});

// UserSchema.pre('save', function(next) {
//   console.log('helooooooooooooo')
//   const err = new Error('something went wronggggggggggggg');
//   // If you call `next()` with an argument, that argument is assumed to be
//   // an error.
//   next(err);
// });

UserSchema.post(['findOne', 'findById', 'find'], function (docs) {
  if (Array.isArray(docs)) {
    //If docs is array it means is triggered by 'find' and return an array of docs
    docs.forEach(function (doc) {
      if (doc && !doc.photo) {
        doc.photo = 'path/myFile.png';
      }
    });
  } else {
    if (docs && !docs.photo) {
      docs.photo = 'path/myFile.png';
    }
  }
});

//JWT functions
UserSchema.methods.getAuthToken = async function () {
  const token = jwt.sign(
    { id: this._id, role: this.role, email: this.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );

  this.authTokens.push(token);
  await this.save();

  return token;
};

UserSchema.methods.getSignedJwtToken = async function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_ACTIVE,
  });

  return token;
};

UserSchema.methods.filterAuthTokens = async function (authToken) {
  this.authTokens = this.authTokens.filter((t) => t !== authToken);
  const user = await this.save();
  return user;
};

UserSchema.methods.generateOTP = async function () {
  const secret = speakeasy.generateSecret();

  const token = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
    time: 7200,
  });

  this.twoFactorSecret = secret.base32;
  this.otp = token;

  await this.save();

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

UserSchema.methods.activate = async function () {
  this.lastActivationRequest = null;
  this.active = true;
  this.save();
};

UserSchema.methods.setLastActivationRequest = async function () {
  this.lastActivationRequest = Date.now();
  this.save();
};

UserSchema.methods.checkActive = async function () {
  return this.active === true;
};

//User schema declaration
const User = mongoose.model('User', UserSchema);

//Password methods
//TODO remove savePassword
User.savePassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(password, salt);
};

User.prototype.setPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(password, salt);
};

User.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//User Retrieval Functions
//TODO temporary
User.getAllUsers = async function () {
  return await this.find();
};
User.getByEmail = async function (
  email,
  withPassword = false,
  withAuthTokens = false,
  withActive = false,
  withLastActivationRequest = false
) {
  return await this.findOne({ email: email.toLowerCase() }).select(
    `${withPassword ? '+password ' : ''}${
      withAuthTokens ? '+authTokens ' : ''
    }${withActive ? '+active ' : ''}${
      withLastActivationRequest ? '+lastActivationRequest ' : ''
    }`
  );
};

User.getByUsername = async function (username) {
  return await this.findOne({ username: username.toLowerCase() });
};

User.getById = async function (
  userId,
  withPassword = false,
  withAuthTokens = false,
  withActive = false,
  withLastActivationRequest = false
) {
  return await this.findById(userId).select(
    `${withPassword ? '+password ' : ''}${
      withAuthTokens ? '+authTokens ' : ''
    }${withActive ? '+active ' : ''}${
      withLastActivationRequest ? '+lastActivationrequest ' : ''
    }`
  );
};

User.getForCreatingPassword = async function (otp) {
  return await this.findOne({ resetPassword: true, otp }).select(
    '+password +authTokens +otp +resetPassword +twoFactorSecret'
  );
};
User.checkUsernameExists = async function (username) {
  const user = await this.exists({ username: username.toLowerCase() });
  return !!user;
};

User.checkEmailExists = async function (email) {
  const user = await this.exists({ email: email.toLowerCase() });
  return !!user;
};

User.checkIdExists = async function (userId) {
  const id = await this.exists({ _id: userId });
  return !!id;
};

//Crud functions
User.createUser = async function (userDetails) {
  const user = await this.create(userDetails);
  return user;
};

User.changePhoto = async function (userId, path) {
  const user = await User.findById(userId);
  user.photo = path;
  await user.save();
};

User.getByFieldAndUpdate = async function (findQuery, updateQuery) {
  const user = await this.findOneAndUpdate(findQuery, updateQuery, {
    new: true,
  });

  return user;
};

User.removeAllUsers = async function() {
  return User.deleteMany({});
};

module.exports = User;
