const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema(
  {
    roomId: { type: String, index: true },
    participants: [{ type: String }], // socket ids or user ids
    mode: { type: String, enum: ['text', 'voice', 'video'], default: 'text' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    messagesCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatLog', chatLogSchema);
