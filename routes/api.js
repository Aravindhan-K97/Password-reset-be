const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const router = express.Router();
const crypto = require('crypto');
require('dotenv').config();

router.use(express.json());

// Signup route
router.post('/signup', async (req, res) => {
  const { username, email, password, repeatPassword } = req.body;

  if (password !== repeatPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, repeatPassword: hashedPassword });

    await newUser.save();
    res.json({ status: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
  
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Invalid password' });
      }
      
      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, "jwttokenkey", { expiresIn: '1h' });
      
      res.json({ token, username: user.username });
    } catch (err) {
      res.status(500).json({ message: 'Error logging in' });
    }
  });

// forgot-password route 
  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not registered' });
      }
  
      const token = crypto.randomBytes(20).toString('hex');
      user.resetToken = token;
      user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
      await user.save();
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'aravindhan2825@gmail.com',
          pass: 'loaemzsguuvztuhj',
        },
        tls: { rejectUnauthorized: false },
      });
  
      const mailOptions = {
        from: 'aravindhan2825@gmail.com',
        to: email,
        subject: 'Reset Password',
        text: `Click the following link to reset your password:https://password-reset-61.netlify.app/auth/reset-password/${token}`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ message: 'Failed to send password reset email' });
        } else {
          // console.log('Password reset email sent:', info.response);
          return res.status(200).json({ message: 'Password reset email sent successfully' });
        }
      });
    } catch (error) {
      console.error('Error occurred:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

// reset-password route
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password, repeatPassword } = req.body;

  // console.log('Received token:', token);
  // console.log('Received passwords:', password, repeatPassword);

  if (!password || !repeatPassword) {
    return res.status(400).json({ message: 'Password and repeat password are required' });
  }

  if (password !== repeatPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    // console.log('Found user:', user);

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.repeatPassword = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.status(200).json({ status: true, message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error occurred while resetting password:', error);
    return res.status(500).json({ status: false, message: 'Failed to reset password. Please try again later.' });
  }
});


module.exports = router;
