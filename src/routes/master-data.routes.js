const express = require('express');
const MasterData = require('../models/MasterData');

const router = express.Router();

function normalizeSearch(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeLimit(value, fallback = 20) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), 50);
}

function filterItems(items, search, limit) {
  const normalizedSearch = normalizeSearch(search);

  return (items || [])
    .filter((item) => item.isActive !== false)
    .filter((item) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchable = [item.label, item.value, ...Object.values(item.metadata || {})]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    })
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .slice(0, limit);
}

router.get('/', async (req, res) => {
  try {
    const keys = String(req.query.keys || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const query = keys.length ? { key: { $in: keys } } : {};
    const docs = await MasterData.find(query).lean();
    const payload = docs.reduce((acc, doc) => {
      acc[doc.key] = filterItems(doc.items, '', 50);
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

    const limit = normalizeLimit(req.query.limit);

    return res.json({
      key: doc.key,
      description: doc.description,
      items: filterItems(doc.items, req.query.search, limit)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
