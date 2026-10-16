const mongoose = require('mongoose');

// The roles a user can hold ("user", "admin"), assigned through UserRole.
const roleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
