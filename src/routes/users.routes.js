const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN'), async (_req, res) => {
  try {
    const users = await User.find()
      .select('-password -resetPasswordOtp -resetPasswordOtpExpiresAt')
      .sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role, isActive, phone, idNumber } = req.body;
    if (!name || !email || !password || !role || !idNumber) {
      return res
        .status(400)
        .json({ message: 'name, email, password, role and idNumber are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { idNumber }] });
    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.email === normalizedEmail
            ? 'A user with this email already exists'
            : 'A user with this ID number already exists'
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      idNumber,
      password: hashed,
      role,
      isActive: isActive ?? true
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: { ...user.toObject(), password: undefined }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const allowedFields = ['role', 'isActive', 'name', 'phone', 'idNumber'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).select('-password -resetPasswordOtp -resetPasswordOtpExpiresAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User updated successfully', user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/status', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: !!req.body.isActive },
      { new: true }
    ).select('-password -resetPasswordOtp -resetPasswordOtpExpiresAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password -resetPasswordOtp -resetPasswordOtpExpiresAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /users/patients/search?q=  — staff looks up registered patients to pre-fill a booking
router.get(
  '/patients/search',
  authenticate,
  authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'),
  async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      if (q.length < 2) return res.json([]);

      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const patients = await User.find({
        role: 'PATIENT',
        isActive: true,
        $or: [{ name: regex }, { phone: regex }, { email: regex }]
      })
        .select('name email phone idNumber')
        .limit(10)
        .lean();

      return res.json(patients);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

function sanitiseMedicalProfile(body) {
  const splitTrim = (v) =>
    typeof v === 'string'
      ? v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : Array.isArray(v)
        ? v.map((s) => String(s).trim()).filter(Boolean)
        : [];

  const allowed = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''];
  const bloodType =
    body.bloodType !== undefined && allowed.includes(body.bloodType) ? body.bloodType : undefined;

  return {
    ...(bloodType !== undefined && { 'medicalProfile.bloodType': bloodType }),
    ...(body.allergies !== undefined && { 'medicalProfile.allergies': splitTrim(body.allergies) }),
    ...(body.conditions !== undefined && {
      'medicalProfile.conditions': splitTrim(body.conditions)
    }),
    ...(body.medications !== undefined && {
      'medicalProfile.medications': splitTrim(body.medications)
    }),
    ...(body.notes !== undefined && { 'medicalProfile.notes': String(body.notes).trim() })
  };
}

router.get('/me/medical-profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('medicalProfile').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user.medicalProfile || {});
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/me/medical-profile', authenticate, async (req, res) => {
  try {
    const updates = sanitiseMedicalProfile(req.body);
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true })
      .select('medicalProfile')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user.medicalProfile || {});
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get(
  '/:id/medical-profile',
  authenticate,
  authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('medicalProfile').lean();
      if (!user) return res.status(404).json({ message: 'Patient not found' });
      return res.json(user.medicalProfile || {});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.patch(
  '/:id/medical-profile',
  authenticate,
  authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'),
  async (req, res) => {
    try {
      const updates = sanitiseMedicalProfile(req.body);
      const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
        .select('medicalProfile')
        .lean();
      if (!user) return res.status(404).json({ message: 'Patient not found' });
      return res.json(user.medicalProfile || {});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
