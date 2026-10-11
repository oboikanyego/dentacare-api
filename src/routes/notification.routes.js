const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — authenticated user gets own notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    return res.json({ count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    return res.json({ updated: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    notification.isRead = true;
    await notification.save();
    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
