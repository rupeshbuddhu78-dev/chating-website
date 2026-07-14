const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reporterAnon: { type: String, default: '' },
    reportedAnon: { type: String, default: '' },
    reason: { type: String, required: true, maxlength: 500 },
    details: { type: String, maxlength: 2000, default: '' },
    roomId: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'actioned', 'dismissed'], default: 'pending', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
