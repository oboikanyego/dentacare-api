const mongoose = require('mongoose');

const auditEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    byRole: { type: String, default: 'SYSTEM' },
    note: { type: String, default: '' }
  },
  { _id: false, timestamps: true }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    patientName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    idNumber: { type: String, trim: true, default: '' },
    serviceId: { type: String, required: true, trim: true },
    serviceName: { type: String, required: true, trim: true },
    dentistId: { type: String, required: true, trim: true },
    dentistName: { type: String, required: true, trim: true },
    branchId: { type: String, trim: true, default: '' },
    branchName: { type: String, trim: true, default: '' },
    date: { type: String, required: true },
    slotId: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, default: 30 },
    reason: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
    internalNotes: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
      default: 'PENDING'
    },
    bookedByRole: {
      type: String,
      enum: ['PUBLIC', 'PATIENT', 'RECEPTIONIST', 'DENTIST', 'ADMIN'],
      default: 'PUBLIC'
    },
    bookedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelReason: { type: String, default: '', trim: true },
    auditTrail: { type: [auditEntrySchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
