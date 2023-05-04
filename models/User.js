const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');

const roles = require('../constants/roles');

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
    authTokens: [],
    role: {
      type: String,
      enum: [roles.ADMIN, roles.USER],
      default: roles.USER,
      required: true,
    },
    photo: { type: String,
        default: null
    },
    otp: { type: String },
    twoFactorSecret: String,
    resetPassword: {
      type: Boolean,
    },
  },
  { timestamps: true }
);


//Mongoose hooks
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.email = this.email.toLowerCase();
    await this.setPassword(this.password);
    next()
});

UserSchema.post(['findOne', 'findById', 'find'], function (docs) {
    if (Array.isArray(docs)) {
        //If docs is array it means is triggered by 'find' and return an array of docs
        docs.forEach(function(doc) {
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
}

User.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

//User Retrieval Functions
//TODO temporary
User.getAllUsers = async function(){
    return await this.find({});
}
User.getUserByEmail = async function(email) {
    return await this.findOne({email: email.toLowerCase()}).select('+password');
}

User.getUserByUsername = async function(username) {
    return await this.findOne({username: username.toLowerCase()});
}

User.getUserByUserId = async function(userId) {
    return await this.findOne({_id: userId});
}

User.checkUsernameExists = async function(username) {
    const user = await this.findOne({username: username.toLowerCase()});
    return !!user;
};

User.checkEmailExists = async function(email) {
    const user = await this.findOne({email: email.toLowerCase()});
    return !!user;
};

User.checkUserIdExists = async function(userId) {
    const id = await this.findOne({_id: userId});
    return !!id;
};

//Crud functions
User.createUser = async function(userDetails) {
    const newUser = await this.create(userDetails);
    return newUser;
}
User.changePhoto = async function(userId, path){
    const user = await User.findById(userId);
    user.photo = path;
    await user.save();
}

//JWT functions
User.getSignedJwtToken = async function () {
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

User.generateOTP = async function () {
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

User.verifyOTP = async function (otp) {
  return speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: 'base32',
    token: otp,
    window: 2,
    time: 7200,
  });
};

module.exports = User;