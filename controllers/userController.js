const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { PREMIUM_PLANS } = require('../config/constants');
const seo = require('../config/seo');

exports.dashboard = async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20).lean();
  res.render('dashboard/index', {
    title: 'Dashboard · QuickTalk',
    seo: seo.build('home'),
    payments,
    plans: PREMIUM_PLANS
  });
};

exports.premiumPage = async (_req, res) => {
  res.render('dashboard/premium', {
    title: seo.PAGES.premium.title,
    seo: seo.build('premium'),
    plans: PREMIUM_PLANS
  });
};

exports.profilePage = (_req, res) =>
  res.render('dashboard/profile', {
    title: 'Profile · QuickTalk',
    seo: seo.build('home'),
    error: null,
    message: null
  });

exports.updateProfile = async (req, res) => {
  const u = await User.findById(req.user._id);
  if (!u) return res.redirect('/auth/login');
  ['name', 'gender', 'country', 'language', 'bio'].forEach((k) => {
    if (req.body[k] != null) u[k] = String(req.body[k]).slice(0, 300);
  });
  if (req.file) u.profileImage = '/uploads/' + req.file.filename;
  await u.save();
  res.render('dashboard/profile', {
    title: 'Profile · QuickTalk',
    seo: seo.build('home'),
    error: null,
    message: 'Profile updated'
  });
};

exports.changePassword = async (req, res) => {
  const u = await User.findById(req.user._id).select('+password');
  if (!u) return res.redirect('/auth/login');
  const { current, next } = req.body;
  if (u.password) {
    const ok = await bcrypt.compare(current || '', u.password);
    if (!ok) return res.render('dashboard/profile', { title: 'Profile', seo: seo.build('home'), error: 'Current password incorrect', message: null });
  }
  if (!next || next.length < 6) return res.render('dashboard/profile', { title: 'Profile', seo: seo.build('home'), error: 'New password too short', message: null });
  u.password = next;
  await u.save();
  res.render('dashboard/profile', {
    title: 'Profile · QuickTalk',
    seo: seo.build('home'),
    error: null,
    message: 'Password changed'
  });
};

exports.paymentsPage = async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.render('dashboard/payments', {
    title: 'Payment History · QuickTalk',
    seo: seo.build('home'),
    payments
  });
};
