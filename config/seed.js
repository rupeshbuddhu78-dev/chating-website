const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const PremiumPlan = require('../models/PremiumPlan');
const Settings = require('../models/Settings');
const { PREMIUM_PLANS } = require('./constants');

/**
 * Seed default admin, plans and settings on boot.
 */
async function seedDefaults() {
  try {
    // ---- Admin ----
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
      if (!existing) {
        const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
        await Admin.create({
          name: 'Super Admin',
          email: process.env.ADMIN_EMAIL.toLowerCase(),
          password: hash,
          role: 'super'
        });
        console.log('[Seed] Default admin created:', process.env.ADMIN_EMAIL);
      }
    }

    // ---- Plans ----
    for (const p of PREMIUM_PLANS) {
      await PremiumPlan.updateOne(
        { code: p.code },
        { $setOnInsert: { ...p, active: true } },
        { upsert: true }
      );
    }

    // ---- Settings ----
    const s = await Settings.findOne();
    if (!s) {
      await Settings.create({
        siteName: 'QuickTalk',
        maintenance: false,
        maxImageKB: 350,
        allowVideoForFree: true
      });
    }
  } catch (e) {
    console.error('[Seed] error:', e.message);
  }
}

module.exports = { seedDefaults };
