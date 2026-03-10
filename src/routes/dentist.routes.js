const express = require('express');
const MasterData = require('../models/MasterData');

const router = express.Router();

/**
 * @swagger
 * /api/dentists:
 *   get:
 *     summary: Get dentists available for display or selection
 *     tags: [Dentists]
 *     responses:
 *       200:
 *         description: List of dentists
 */
router.get('/', async (_req, res) => {
  try {
    const doc = await MasterData.findOne({ key: 'dentists' }).lean();
    const dentists = (doc?.items || [])
      .filter((item) => item.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((item) => ({
        _id: item.value,
        name: item.label,
        specialization: item?.metadata?.specialization || '',
        email: item?.metadata?.email || '',
        phone: item?.metadata?.phone || '',
        image: item?.metadata?.image || ''
      }));

    return res.json(dentists);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/dentists/{id}:
 *   get:
 *     summary: Get a dentist by id
 *     tags: [Dentists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dentist details
 *       404:
 *         description: Dentist not found
 */
router.get('/:id', async (req, res) => {
  try {
    const doc = await MasterData.findOne({ key: 'dentists' }).lean();
    const item = (doc?.items || []).find((entry) => entry.value === req.params.id && entry.isActive !== false);

    if (!item) {
      return res.status(404).json({ message: 'Dentist not found' });
    }

    return res.json({
      _id: item.value,
      name: item.label,
      specialization: item?.metadata?.specialization || '',
      email: item?.metadata?.email || '',
      phone: item?.metadata?.phone || '',
      image: item?.metadata?.image || ''
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
