const mongoose = require('mongoose');

const treatmentNoteSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    patientEmail: { type: String, required: true, lowercase: true, trim: true },
    dentistId: { type: String, required: true, trim: true },
    dentistName: { type: String, required: true, trim: true },
    serviceId: { type: String, required: true, trim: true },
    serviceName: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    diagnosis: { type: String, default: '', trim: true },
    treatment: { type: String, default: '', trim: true },
    prescription: { type: String, default: '', trim: true },
    followUpDate: { type: String, default: null },
    notes: { type: String, default: '', trim: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdByRole: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TreatmentNote', treatmentNoteSchema);
