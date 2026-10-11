const express = require('express');
const TreatmentNote = require('../models/TreatmentNote');
const Appointment = require('../models/Appointment');
const { authenticate, authorize } = require('../middleware/auth');
const { sendTreatmentNoteCreatedEmail } = require('../services/email.service');
const { notifyUser } = require('../services/notification.service');

const router = express.Router();

// POST /api/treatment-notes  — staff creates a note for a completed appointment
router.post('/', authenticate, authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'), async (req, res) => {
  try {
    const { appointmentId, diagnosis, treatment, prescription, followUpDate, notes } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'appointmentId is required' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const existing = await TreatmentNote.findOne({ appointmentId });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'A treatment note already exists for this appointment' });
    }

    const note = await TreatmentNote.create({
      appointmentId,
      patientId: appointment.patientId || null,
      patientEmail: appointment.email,
      dentistId: appointment.dentistId,
      dentistName: appointment.dentistName,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      date: appointment.date,
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      prescription: prescription || '',
      followUpDate: followUpDate || null,
      notes: notes || '',
      createdByUserId: req.user.id,
      createdByRole: req.user.role
    });

    await sendTreatmentNoteCreatedEmail(note);
    if (note.patientId) {
      await notifyUser(note.patientId, {
        type: 'TREATMENT_NOTE_CREATED',
        title: 'Treatment note available',
        message: `Your treatment note from ${note.date} by ${note.dentistName} has been added.`
      });
    }

    return res.status(201).json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/treatment-notes/today  — all notes for today's appointments
router.get(
  '/today',
  authenticate,
  authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'),
  async (req, res) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const notes = await TreatmentNote.find({ date: today }).lean();
      return res.json(notes);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// GET /api/treatment-notes/follow-ups?days=7  — staff lists patients due for follow-up
router.get(
  '/follow-ups',
  authenticate,
  authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'),
  async (req, res) => {
    try {
      const days = Math.min(Math.max(parseInt(req.query.days) || 7, 0), 90);
      const today = new Date().toISOString().slice(0, 10);
      const future = new Date();
      future.setDate(future.getDate() + days);
      const futureStr = future.toISOString().slice(0, 10);

      // 30-day look-back for overdue follow-ups
      const past = new Date();
      past.setDate(past.getDate() - 30);
      const pastStr = past.toISOString().slice(0, 10);

      const notes = await TreatmentNote.find({
        followUpDate: { $ne: null, $gte: pastStr, $lte: futureStr }
      })
        .sort({ followUpDate: 1 })
        .lean();

      const enriched = notes.map((n) => ({
        ...n,
        overdue: n.followUpDate < today
      }));

      return res.json(enriched);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// GET /api/treatment-notes?email=  — staff lists notes for a patient by email
router.get('/', authenticate, authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'), async (req, res) => {
  try {
    const { email, patientId } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    else if (email) filter.patientEmail = String(email).toLowerCase().trim();
    else return res.status(400).json({ message: 'email or patientId query param required' });

    const notes = await TreatmentNote.find(filter).sort({ date: -1, createdAt: -1 });
    return res.json(notes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/treatment-notes/mine  — patient fetches their own notes
router.get('/mine', authenticate, authorize('PATIENT'), async (req, res) => {
  try {
    const notes = await TreatmentNote.find({
      $or: [{ patientId: req.user.id }, { patientEmail: req.user.email }]
    }).sort({ date: -1, createdAt: -1 });
    return res.json(notes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/treatment-notes/:id  — get single note (staff)
router.get(
  '/:id',
  authenticate,
  authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'),
  async (req, res) => {
    try {
      const note = await TreatmentNote.findById(req.params.id);
      if (!note) return res.status(404).json({ message: 'Note not found' });
      return res.json(note);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// PATCH /api/treatment-notes/:id  — staff updates a note
router.patch('/:id', authenticate, authorize('DENTIST', 'ADMIN'), async (req, res) => {
  try {
    const note = await TreatmentNote.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const allowed = ['diagnosis', 'treatment', 'prescription', 'followUpDate', 'notes'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) note[key] = req.body[key];
    }
    await note.save();
    return res.json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
