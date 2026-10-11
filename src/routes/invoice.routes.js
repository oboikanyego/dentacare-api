const express = require('express');
const Invoice = require('../models/Invoice');
const Appointment = require('../models/Appointment');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyUser } = require('../services/notification.service');

const router = express.Router();

// POST /api/invoices — staff creates invoice for an appointment
router.post('/', authenticate, authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'), async (req, res) => {
  try {
    const { appointmentId, items, taxRate, dueDate, notes } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'appointmentId is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one line item is required' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const existing = await Invoice.findOne({ appointmentId });
    if (existing) {
      return res.status(409).json({ message: 'An invoice already exists for this appointment' });
    }

    const parsedItems = items.map((item) => ({
      description: String(item.description || '').trim(),
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      total: Number(item.quantity || 1) * Number(item.unitPrice || 0)
    }));

    const subtotal = parsedItems.reduce((sum, i) => sum + i.total, 0);
    const rate = Math.max(0, Math.min(100, Number(taxRate) || 0));
    const taxAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    const invoice = await Invoice.create({
      appointmentId,
      patientId: appointment.patientId || null,
      patientEmail: appointment.email,
      patientName: appointment.patientName,
      patientPhone: appointment.phone,
      dentistId: appointment.dentistId,
      dentistName: appointment.dentistName,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      branchId: appointment.branchId || '',
      branchName: appointment.branchName || '',
      date: appointment.date,
      items: parsedItems,
      subtotal,
      taxRate: rate,
      taxAmount,
      total,
      dueDate: dueDate || null,
      notes: notes || '',
      createdByUserId: req.user.id,
      createdByRole: req.user.role
    });

    if (invoice.patientId) {
      await notifyUser(invoice.patientId, {
        type: 'INVOICE_CREATED',
        title: 'New invoice issued',
        message: `Invoice ${invoice.invoiceNumber} for R ${invoice.total.toFixed(2)} is now available.`
      });
    }

    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/invoices — staff lists invoices with optional filters
router.get('/', authenticate, authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'), async (req, res) => {
  try {
    const { email, patientId, status, dateFrom, dateTo } = req.query;
    const filter = {};

    if (patientId) filter.patientId = patientId;
    else if (email) filter.patientEmail = String(email).toLowerCase().trim();

    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = String(dateFrom);
      if (dateTo) filter.date.$lte = String(dateTo);
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).limit(200);
    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/invoices/mine — patient views own invoices
router.get('/mine', authenticate, authorize('PATIENT'), async (req, res) => {
  try {
    const invoices = await Invoice.find({
      $or: [{ patientId: req.user.id }, { patientEmail: req.user.email }]
    }).sort({ createdAt: -1 });
    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/invoices/:id — get single invoice (staff or patient-own)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const role = req.user.role;
    if (role === 'PATIENT') {
      const owns =
        String(invoice.patientId) === String(req.user.id) ||
        invoice.patientEmail === req.user.email;
      if (!owns) return res.status(403).json({ message: 'Access denied' });
    } else if (!['RECEPTIONIST', 'DENTIST', 'ADMIN'].includes(role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(invoice);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/invoices/:id — staff updates notes or due date
router.patch('/:id', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot modify a cancelled invoice' });
    }

    const allowed = ['notes', 'dueDate', 'status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) invoice[key] = req.body[key];
    }
    if (req.body.status === 'CANCELLED') {
      invoice.paidAt = null;
      invoice.paymentMethod = '';
    }
    await invoice.save();
    return res.json(invoice);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/invoices/:id/pay — mark invoice as paid
router.patch('/:id/pay', authenticate, authorize('RECEPTIONIST', 'ADMIN'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status !== 'UNPAID') {
      return res
        .status(400)
        .json({ message: `Invoice is already ${invoice.status.toLowerCase()}` });
    }

    invoice.status = 'PAID';
    invoice.paidAt = new Date();
    invoice.paymentMethod = req.body.paymentMethod || 'CASH';
    await invoice.save();
    return res.json(invoice);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
