const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['PATIENT', 'RECEPTIONIST', 'DENTIST', 'ADMIN'],
      default: 'PATIENT'
    },
    isActive: { type: Boolean, default: true },
    phone: { type: String, trim: true },
    idNumber: { type: String, trim: true, default: '' },
    resetPasswordOtp: { type: String, default: null },
    resetPasswordOtpExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
