const mongoose = require('mongoose');

const masterDataItemSchema = new mongoose.Schema(
  {
    value: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

const masterDataSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    items: { type: [masterDataItemSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MasterData', masterDataSchema);
