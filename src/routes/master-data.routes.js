const express = require('express');
const MasterData = require('../models/MasterData');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const keys = String(req.query.keys || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const query = keys.length ? { key: { $in: keys } } : {};
    const docs = await MasterData.find(query).lean();
    const payload = docs.reduce((acc, doc) => {
      acc[doc.key] = (doc.items || [])
        .filter((item) => item.isActive !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      return acc;
    }, {});

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const doc = await MasterData.findOne({ key: req.params.key }).lean();

    if (!doc) {
      return res.status(404).json({ message: 'Master data not found' });
    }

    return res.json({
      key: doc.key,
      description: doc.description,
      items: (doc.items || [])
        .filter((item) => item.isActive !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
