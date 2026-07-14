const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'QuickTalk' },
    maintenance: { type: Boolean, default: false },
    maintenanceMsg: { type: String, default: '' },
    maxImageKB: { type: Number, default: 350 },
    allowVideoForFree: { type: Boolean, default: true },
    supportEmail: { type: String, default: 'support@livegirlschat.online' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
