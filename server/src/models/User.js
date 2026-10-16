const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Bcrypt hash only - never the plaintext password.
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    // Free-form for now; null until the user provides one.
    address: {
      type: String,
      trim: true,
      default: null,
    },
    // Roles live in the userRoles collection (models/UserRole.js).
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, 10);
};

module.exports = mongoose.model('User', userSchema);
