const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendAppointmentReminderEmail } = require('../services/email.service');

function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

async function sendReminders() {
  const date = getTomorrowDateString();
  console.log(`[reminders] Checking appointments for ${date}`);

  try {
    const appointments = await Appointment.find({
      date,
      status: { $in: ['PENDING', 'CONFIRMED'] }
    }).lean();

    console.log(`[reminders] Found ${appointments.length} appointment(s) for tomorrow`);

    for (const appt of appointments) {
      await sendAppointmentReminderEmail(appt);
    }
  } catch (err) {
    console.error('[reminders] Failed to run reminder job:', err.message);
  }
}

function scheduleReminders() {
  // Daily at 08:00 server time
  cron.schedule('0 8 * * *', sendReminders);
  console.log('[reminders] Appointment reminder job scheduled (daily at 08:00)');
}

module.exports = { scheduleReminders, sendReminders };
