const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    blockedAnonId: { type: String, default: '' },
    blockedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

blockSchema.index({ blocker: 1, blockedUser: 1 });
blockSchema.index({ blocker: 1, blockedAnonId: 1 });

module.exports = mongoose.model('Block', blockSchema);
