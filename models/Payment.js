const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    cfOrderId: { type: String, default: '' },
    planCode: { type: String, required: true },
    amount: { type: Number, required: true },
    days: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'],
      default: 'CREATED',
      index: true
    },
    method: { type: String, default: '' },
    signature: { type: String, default: '' },
    raw: { type: Object, default: {} },
    activatedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
