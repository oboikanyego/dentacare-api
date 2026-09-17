const express = require('express');
const MasterData = require('../models/MasterData');

const router = express.Router();

function normalizeSearch(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizeLimit(value, fallback = 20) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), 50);
}

function mapDentist(item) {
  return {
    _id: item.value,
    name: item.label,
    specialization: item?.metadata?.specialization || '',
    email: item?.metadata?.email || '',
    phone: item?.metadata?.phone || '',
    image: item?.metadata?.image || ''
  };
}

/**
 * @swagger
 * /api/dentists:
 *   get:
 *     summary: Search dentists available for display or selection
 *     tags: [Dentists]
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           maximum: 50
 *     responses:
 *       200:
 *         description: List of dentists
 */
router.get('/', async (req, res) => {
  try {
    const doc = await MasterData.findOne({ key: 'dentists' }).lean();
    const search = normalizeSearch(req.query.search);
    const limit = normalizeLimit(req.query.limit);

    const dentists = (doc?.items || [])
      .filter((item) => item.isActive !== false)
      .filter((item) => {
        if (!search) {
          return true;
        }

        const searchable = [
          item.label,
          item.value,
          item?.metadata?.specialization,
          item?.metadata?.email,
          item?.metadata?.phone
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(search);
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .slice(0, limit)
      .map(mapDentist);

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
    const item = (doc?.items || []).find(
      (entry) => entry.value === req.params.id && entry.isActive !== false
    );

    if (!item) {
      return res.status(404).json({ message: 'Dentist not found' });
    }

    return res.json(mapDentist(item));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
