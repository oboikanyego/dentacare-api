const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { sendPasswordResetOtpEmail } = require('../services/email.service');

const router = express.Router();

function buildAuthResponse(user) {
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return {
    message: 'Authentication successful',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      phone: user.phone || '',
      idNumber: user.idNumber || ''
    }
  };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, idNumber } = req.body;

    if (!name || !email || !password || !idNumber) {
      return res.status(400).json({ message: 'name, email, password and idNumber are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { idNumber }] });
    if (existingUser) {
      return res.status(409).json({ message: existingUser.email === normalizedEmail ? 'A user with this email already exists' : 'A user with this ID number already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      idNumber,
      password: hashed,
      role: 'PATIENT'
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return res.json({ message: 'If an account exists for that email, an OTP has been sent.' });
    }

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    user.resetPasswordOtp = await bcrypt.hash(otp, 10);
    user.resetPasswordOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetOtpEmail({
      name: user.name,
      email: user.email,
      otp
    });

    return res.json({ message: 'If an account exists for that email, an OTP has been sent.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'email, otp and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (user.resetPasswordOtpExpiresAt.getTime() < Date.now()) {
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const isValidOtp = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!isValidOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiresAt = null;
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetPasswordOtp -resetPasswordOtpExpiresAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
