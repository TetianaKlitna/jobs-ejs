const mongoose = require('mongoose');
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const scrypt = promisify(crypto.scrypt);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide name'],
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name cannot be longer than 50 characters'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [100, 'Email cannot be longer than 100 characters'],
      validate: {
        validator: (v) => validator.isEmail(v),
        message: 'Please provide a valid email',
      },
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: (v) =>
          validator.isStrongPassword(v, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          }),
        message:
          'Password must be stronger: include uppercase, lowercase, number, and symbol',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(this.password, salt, 64);
  this.password = `${salt}:${derivedKey.toString('hex')}`;

  next();
});

UserSchema.methods.createJWT = function () {
  const token = jwt.sign(
    { userId: this._id, name: this.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
  return token;
};

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const [salt, key] = this.password.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = await scrypt(candidatePassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
};

module.exports = mongoose.model('User', UserSchema);
