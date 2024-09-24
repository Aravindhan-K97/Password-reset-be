const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  repeatPassword: { type: String, required: true },
  resetToken: { type: String }, // Field for storing the reset token
  resetTokenExpiry: { type: Date } // Field for storing the reset token expiry time
});

const User = mongoose.model('User', userSchema);

module.exports = User;

