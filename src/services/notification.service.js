const Notification = require('../models/Notification');

async function notifyUser(userId, { type, title, message, appointmentId = null }) {
  if (!userId) return;
  try {
    await Notification.create({ userId, type, title, message, appointmentId });
  } catch (_) {}
}

async function notifyAllStaff({ type, title, message, appointmentId = null }) {
  try {
    const User = require('../models/User');
    const staff = await User.find({
      role: { $in: ['RECEPTIONIST', 'ADMIN'] },
      isActive: true
    })
      .select('_id')
      .lean();
    if (staff.length > 0) {
      await Notification.insertMany(
        staff.map((u) => ({ userId: u._id, type, title, message, appointmentId }))
      );
    }
  } catch (_) {}
}

module.exports = { notifyUser, notifyAllStaff };
