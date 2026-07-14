const cron = require('node-cron');
const User = require('../models/User');

/**
 * Every hour: expire premium users whose expiry has passed.
 */
function startCrons() {
  cron.schedule('0 * * * *', async () => {
    try {
      const res = await User.updateMany(
        { isPremium: true, premiumExpiry: { $lte: new Date() } },
        { $set: { isPremium: false, premiumPlan: '' } }
      );
      if (res.modifiedCount) console.log(`[Cron] expired ${res.modifiedCount} premium accounts`);
    } catch (e) {
      console.error('[Cron] premium expiry error:', e.message);
    }
  });
  console.log('[Cron] scheduled premium expiry job (hourly)');
}

module.exports = startCrons;
