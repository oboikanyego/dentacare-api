const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

let invoiceCounter = 0;

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, trim: true },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true
    },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    patientEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    patientName: { type: String, required: true, trim: true },
    patientPhone: { type: String, trim: true, default: '' },
    dentistId: { type: String, trim: true, default: '' },
    dentistName: { type: String, trim: true, default: '' },
    serviceId: { type: String, trim: true, default: '' },
    serviceName: { type: String, trim: true, default: '' },
    branchId: { type: String, trim: true, default: '' },
    branchName: { type: String, trim: true, default: '' },
    date: { type: String, required: true },
    items: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['UNPAID', 'PAID', 'CANCELLED'],
      default: 'UNPAID',
      index: true
    },
    dueDate: { type: String, default: null },
    paidAt: { type: Date, default: null },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CARD', 'EFT', 'INSURANCE', 'OTHER', ''],
      default: ''
    },
    notes: { type: String, default: '', trim: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdByRole: { type: String, default: 'ADMIN' }
  },
  { timestamps: true }
);

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const year = new Date().getFullYear();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
