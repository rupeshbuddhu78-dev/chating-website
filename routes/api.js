const express = require('express');
const { protect } = require('../middleware/auth');
const Report = require('../models/Report');
const Block = require('../models/Block');

const router = express.Router();

router.get('/me', protect, (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      gender: u.gender,
      country: u.country,
      language: u.language,
      isPremium: u.isPremium && u.premiumExpiry && u.premiumExpiry > new Date(),
      premiumExpiry: u.premiumExpiry
    }
  });
});

router.post('/report', async (req, res) => {
  const { reason, details, roomId, reportedAnon, reportedUser } = req.body;
  if (!reason) return res.status(400).json({ success: false, error: 'reason required' });
  await Report.create({
    reporter: req.user?._id,
    reportedUser: reportedUser || undefined,
    reporterAnon: req.user ? '' : 'anon',
    reportedAnon: reportedAnon || '',
    reason: String(reason).slice(0, 500),
    details: String(details || '').slice(0, 2000),
    roomId: String(roomId || '')
  });
  res.json({ success: true });
});

router.post('/block', protect, async (req, res) => {
  const { blockedAnonId, blockedUser } = req.body;
  await Block.create({ blocker: req.user._id, blockedAnonId, blockedUser });
  res.json({ success: true });
});

module.exports = router;
