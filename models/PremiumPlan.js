const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    days: { type: Number, required: true },
    active: { type: Boolean, default: true },
    perks: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('PremiumPlan', planSchema);
