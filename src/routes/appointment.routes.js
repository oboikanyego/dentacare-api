const express = require('express');
const Appointment = require('../models/Appointment');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth');
const { sendAppointmentBookedEmail, sendAppointmentCancelledEmail } = require('../services/email.service');

const router = express.Router();
const WORK_START = 9;
const WORK_END = 17;
const ALLOWED_DURATIONS = [30, 45, 60];

function ensureFutureDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requested = new Date(date);
  requested.setHours(0, 0, 0, 0);
  return requested >= today;
}

function parseTimeString(time) {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error('Invalid time selected');
  }
  return hours * 60 + minutes;
}

function ensureWorkingHours(time, durationMinutes) {
  const start = parseTimeString(time);
  const startHour = Math.floor(start / 60);
  const end = start + Number(durationMinutes || 30);
  if (startHour < WORK_START || end > WORK_END * 60) {
    throw new Error('Selected slot is outside clinic working hours');
  }
}

function overlaps(startA, durationA, startB, durationB) {
  const endA = startA + durationA;
  const endB = startB + durationB;
  return startA < endB && startB < endA;
}

async function ensureSlotAvailable({ date, time, dentistId, durationMinutes, excludeId = null }) {
  const query = {
    date,
    dentistId,
    status: { $nin: ['CANCELLED', 'COMPLETED', 'NO_SHOW'] }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingList = await Appointment.find(query);
  const requestedStart = parseTimeString(time);
  for (const existing of existingList) {
    if (overlaps(requestedStart, durationMinutes, parseTimeString(existing.time), Number(existing.durationMinutes || 30))) {
      throw new Error('This dentist already has a booking for the selected date and time');
    }
  }
}

async function ensurePatientNotDoubleBooked({ date, time, durationMinutes, patientId, email, idNumber, excludeId = null }) {
  const patientQuery = {
    date,
    status: { $nin: ['CANCELLED', 'COMPLETED', 'NO_SHOW'] },
    $or: [
      ...(patientId ? [{ patientId }] : []),
      ...(email ? [{ email }] : []),
      ...(idNumber ? [{ idNumber }] : [])
    ]
  };

  if (!patientQuery.$or.length) {
    return;
  }

  if (excludeId) {
    patientQuery._id = { $ne: excludeId };
  }

  const existingList = await Appointment.find(patientQuery);
  const requestedStart = parseTimeString(time);
  for (const existing of existingList) {
    if (overlaps(requestedStart, durationMinutes, parseTimeString(existing.time), Number(existing.durationMinutes || 30))) {
      throw new Error('The patient is already booked for an overlapping time slot');
    }
  }
}

function addAudit(appointment, { action, byUserId = null, byRole = 'SYSTEM', note = '' }) {
  appointment.auditTrail = appointment.auditTrail || [];
  appointment.auditTrail.push({ action, byUserId, byRole, note, createdAt: new Date(), updatedAt: new Date() });
}

async function createAppointment(payload) {
  if (!payload.patientName || !payload.email || !payload.phone || !payload.idNumber || !payload.date || !payload.time || !payload.serviceId || !payload.serviceName || !payload.slotId || !payload.dentistId || !payload.dentistName || !payload.branchId || !payload.branchName) {
    throw new Error('patientName, email, phone, idNumber, date, time, serviceId, serviceName, slotId, dentistId, dentistName, branchId and branchName are required');
  }

  if (!ensureFutureDate(payload.date)) {
    throw new Error('Appointments cannot be booked in the past');
  }

  if (!ALLOWED_DURATIONS.includes(Number(payload.durationMinutes || 30))) {
    throw new Error('Duration must be 30, 45 or 60 minutes');
  }

  ensureWorkingHours(payload.time, Number(payload.durationMinutes || 30));
  await ensureSlotAvailable({ date: payload.date, time: payload.time, dentistId: payload.dentistId, durationMinutes: Number(payload.durationMinutes || 30) });
  await ensurePatientNotDoubleBooked({ date: payload.date, time: payload.time, durationMinutes: Number(payload.durationMinutes || 30), patientId: payload.patientId || null, email: payload.email, idNumber: payload.idNumber });

  const appointment = await Appointment.create({
    ...payload,
    auditTrail: [{ action: 'CREATED', byUserId: payload.bookedByUserId || null, byRole: payload.bookedByRole || 'SYSTEM', note: 'Appointment created' }]
  });
  await sendAppointmentBookedEmail(appointment);
  return appointment;
}

router.post('/', optionalAuthenticate, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      email: req.body.email?.toLowerCase(),
      patientId: req.user?.id || null,
      bookedByRole: req.user?.role === 'PATIENT' ? 'PATIENT' : 'PUBLIC',
      bookedByUserId: req.user?.id || null,
      status: req.body.status || (req.user?.role === 'PATIENT' ? 'CONFIRMED' : 'PENDING')
    };

    const appointment = await createAppointment(payload);
    return res.status(201).json(appointment);
  } catch (error) {
    return res.status(error.message.match(/required|past|selected|Duration|overlapping|outside/) ? 400 : 500).json({ message: error.message });
  }
});

router.post('/mine', authenticate, authorize('PATIENT'), async (req, res) => {
  try {
    const payload = {
      ...req.body,
      email: req.user.email,
      patientId: req.user.id,
      bookedByRole: 'PATIENT',
      bookedByUserId: req.user.id,
      status: req.body.status || 'CONFIRMED'
    };

    const appointment = await createAppointment(payload);
    return res.status(201).json(appointment);
  } catch (error) {
    return res.status(error.message.match(/required|past|selected|Duration|overlapping|outside/) ? 400 : 500).json({ message: error.message });
  }
});

router.get('/mine', authenticate, authorize('PATIENT'), async (req, res) => {
  try {
    const list = await Appointment.find({
      $or: [{ patientId: req.user.id }, { email: req.user.email }]
    }).sort({ createdAt: -1 });

    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/mine/:id/cancel', authenticate, authorize('PATIENT'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      $or: [{ patientId: req.user.id }, { email: req.user.email }]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Appointment cannot be cancelled' });
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = req.user.id;
    appointment.cancelReason = req.body.cancelReason || 'Cancelled by patient';
    addAudit(appointment, { action: 'CANCELLED', byUserId: req.user.id, byRole: req.user.role, note: appointment.cancelReason });
    await appointment.save();

    await sendAppointmentCancelledEmail(appointment);

    return res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});


router.patch('/mine/:id', authenticate, authorize('PATIENT'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      $or: [{ patientId: req.user.id }, { email: req.user.email }]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Appointment cannot be updated' });
    }

    const allowed = ['date', 'slotId', 'time', 'reason', 'notes'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        appointment[key] = req.body[key];
      }
    }

    if (!ensureFutureDate(appointment.date)) {
      return res.status(400).json({ message: 'Appointments cannot be moved to a past date' });
    }

    ensureWorkingHours(appointment.time, Number(appointment.durationMinutes || 30));
    await ensureSlotAvailable({ date: appointment.date, time: appointment.time, dentistId: appointment.dentistId, durationMinutes: Number(appointment.durationMinutes || 30), excludeId: appointment._id });
    await ensurePatientNotDoubleBooked({ date: appointment.date, time: appointment.time, durationMinutes: Number(appointment.durationMinutes || 30), patientId: appointment.patientId || null, email: appointment.email, idNumber: appointment.idNumber, excludeId: appointment._id });
    addAudit(appointment, { action: 'UPDATED', byUserId: req.user.id, byRole: req.user.role, note: req.body.auditNote || 'Appointment updated by patient' });
    await appointment.save();

    return res.json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    return res.status(error.message.match(/past|selected|Duration|overlapping|outside|moved/) ? 400 : 500).json({ message: error.message });
  }
});

router.get('/', authenticate, authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'), async (_req, res) => {
  try {
    const list = await Appointment.find().sort({ createdAt: -1 });
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/staff', authenticate, authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'), async (req, res) => {
  try {
    const appointment = await createAppointment({
      ...req.body,
      email: req.body.email?.toLowerCase(),
      bookedByRole: req.user.role,
      bookedByUserId: req.user.id,
      status: req.body.status || 'CONFIRMED'
    });

    return res.status(201).json(appointment);
  } catch (error) {
    return res.status(error.message.match(/required|past|selected|Duration|overlapping|outside/) ? 400 : 500).json({ message: error.message });
  }
});

router.patch('/:id', authenticate, authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const allowed = ['patientName','phone','idNumber','serviceId','serviceName','dentistId','dentistName','branchId','branchName','date','slotId','time','durationMinutes','reason','notes','internalNotes','status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        appointment[key] = req.body[key];
      }
    }

    if (!ensureFutureDate(appointment.date) && appointment.status !== 'COMPLETED' && appointment.status !== 'NO_SHOW') {
      return res.status(400).json({ message: 'Appointments cannot be moved to a past date' });
    }

    ensureWorkingHours(appointment.time, Number(appointment.durationMinutes || 30));
    await ensureSlotAvailable({ date: appointment.date, time: appointment.time, dentistId: appointment.dentistId, durationMinutes: Number(appointment.durationMinutes || 30), excludeId: appointment._id });
    await ensurePatientNotDoubleBooked({ date: appointment.date, time: appointment.time, durationMinutes: Number(appointment.durationMinutes || 30), patientId: appointment.patientId || null, email: appointment.email, idNumber: appointment.idNumber, excludeId: appointment._id });

    addAudit(appointment, { action: 'UPDATED', byUserId: req.user.id, byRole: req.user.role, note: req.body.auditNote || 'Appointment updated' });
    await appointment.save();
    return res.json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    return res.status(error.message.match(/past|selected|Duration|overlapping|outside|moved/) ? 400 : 500).json({ message: error.message });
  }
});

router.patch('/:id/cancel', authenticate, authorize('RECEPTIONIST', 'DENTIST', 'ADMIN'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = req.user.id;
    appointment.cancelReason = req.body.cancelReason || 'Cancelled by staff';
    addAudit(appointment, { action: 'CANCELLED', byUserId: req.user.id, byRole: req.user.role, note: appointment.cancelReason });
    await appointment.save();

    await sendAppointmentCancelledEmail(appointment);

    return res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
