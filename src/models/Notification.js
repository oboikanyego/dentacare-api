const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        'APPOINTMENT_PENDING',
        'APPOINTMENT_CONFIRMED',
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT_RESCHEDULED',
        'INVOICE_CREATED',
        'TREATMENT_NOTE_CREATED'
      ],
      required: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    isRead: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
