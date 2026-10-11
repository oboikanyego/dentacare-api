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
    resetPasswordOtpExpiresAt: { type: Date, default: null },
    medicalProfile: {
      bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
        default: ''
      },
      allergies: [{ type: String, trim: true }],
      conditions: [{ type: String, trim: true }],
      medications: [{ type: String, trim: true }],
      notes: { type: String, trim: true, default: '' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
