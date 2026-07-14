const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Payment = require('../models/Payment');
const Report = require('../models/Report');
const Settings = require('../models/Settings');
const { daysFromNow } = require('../utils/helpers');

/** GET login */
exports.loginPage = (_req, res) => res.render('admin/login', { title: 'Admin Login', error: null, layout: 'layouts/admin' });

/** POST login */
exports.doLogin = async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email: String(email || '').toLowerCase() });
  if (!admin) return res.render('admin/login', { title: 'Admin Login', error: 'Invalid credentials', layout: 'layouts/admin' });
  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return res.render('admin/login', { title: 'Admin Login', error: 'Invalid credentials', layout: 'layouts/admin' });
  const token = jwt.sign({ id: admin._id.toString(), role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600 * 1000
  });
  res.redirect('/admin');
};

exports.logout = (_req, res) => {
  res.clearCookie('admin_token');
  res.redirect('/admin/login');
};

/** Admin dashboard */
exports.dashboard = async (req, res) => {
  const [totalUsers, premiumUsers, bannedUsers, totalPayments, paidAgg, reportsPending] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isPremium: true, premiumExpiry: { $gt: new Date() } }),
    User.countDocuments({ banned: true }),
    Payment.countDocuments(),
    Payment.aggregate([{ $match: { status: 'PAID' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    Report.countDocuments({ status: 'pending' })
  ]);
  const revenue = paidAgg?.[0]?.sum || 0;
  const io = req.app.get('io');
  const onlineUsers = io ? io.engine.clientsCount : 0;
  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    stats: { totalUsers, premiumUsers, bannedUsers, totalPayments, revenue, reportsPending, onlineUsers },
    layout: 'layouts/admin'
  });
};

/** Users list */
exports.users = async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = q ? { $or: [{ email: new RegExp(q, 'i') }, { name: new RegExp(q, 'i') }] } : {};
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  res.render('admin/users', { title: 'Users', users, q, layout: 'layouts/admin' });
};

exports.banUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { banned: true, banReason: req.body.reason || 'Violation' });
  res.redirect('back');
};
exports.unbanUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { banned: false, banReason: '' });
  res.redirect('back');
};
exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/admin/users');
};
exports.givePremium = async (req, res) => {
  const days = Math.max(1, Number(req.body.days || 30));
  const u = await User.findById(req.params.id);
  if (u) {
    const base = u.activePremium() ? u.premiumExpiry.getTime() : Date.now();
    u.isPremium = true;
    u.premiumPlan = 'ADMIN';
    u.premiumExpiry = new Date(base + days * 24 * 3600 * 1000);
    await u.save();
  }
  res.redirect('back');
};
exports.removePremium = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isPremium: false, premiumPlan: '', premiumExpiry: null });
  res.redirect('back');
};

/** Payments list */
exports.payments = async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = q ? { $or: [{ orderId: new RegExp(q, 'i') }, { planCode: new RegExp(q, 'i') }] } : {};
  const payments = await Payment.find(filter).populate('user', 'email name').sort({ createdAt: -1 }).limit(200).lean();
  res.render('admin/payments', { title: 'Payments', payments, q, layout: 'layouts/admin' });
};

exports.exportPaymentsCSV = async (_req, res) => {
  const rows = await Payment.find().populate('user', 'email').sort({ createdAt: -1 }).lean();
  const header = 'orderId,email,plan,amount,status,createdAt\n';
  const csv = rows.map(r => [r.orderId, r.user?.email || '', r.planCode, r.amount, r.status, r.createdAt.toISOString()].join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
  res.send(header + csv);
};

/** Reports */
exports.reports = async (_req, res) => {
  const reports = await Report.find().populate('reporter reportedUser', 'name email').sort({ createdAt: -1 }).limit(200).lean();
  res.render('admin/reports', { title: 'Reports', reports, layout: 'layouts/admin' });
};

exports.actionReport = async (req, res) => {
  const action = req.body.action;
  const r = await Report.findById(req.params.id);
  if (!r) return res.redirect('/admin/reports');
  if (action === 'dismiss') r.status = 'dismissed';
  else if (action === 'ban' && r.reportedUser) {
    await User.findByIdAndUpdate(r.reportedUser, { banned: true, banReason: 'Reported: ' + r.reason });
    r.status = 'actioned';
  } else r.status = 'actioned';
  await r.save();
  res.redirect('/admin/reports');
};

/** Settings */
exports.settingsPage = async (_req, res) => {
  const settings = await Settings.findOne();
  res.render('admin/settings', { title: 'Settings', settings, layout: 'layouts/admin' });
};

exports.saveSettings = async (req, res) => {
  const s = (await Settings.findOne()) || new Settings();
  s.siteName = req.body.siteName || s.siteName;
  s.maintenance = req.body.maintenance === 'on';
  s.maintenanceMsg = req.body.maintenanceMsg || '';
  s.maxImageKB = Math.max(50, Math.min(2000, Number(req.body.maxImageKB) || 350));
  s.allowVideoForFree = req.body.allowVideoForFree === 'on';
  s.supportEmail = req.body.supportEmail || s.supportEmail;
  await s.save();
  res.redirect('/admin/settings');
};

/** Live chat status */
exports.chatStatus = (req, res) => {
  const io = req.app.get('io');
  const state = req.app.get('matchState') || {};
  res.render('admin/chat', {
    title: 'Live Chat',
    online: io ? io.engine.clientsCount : 0,
    waiting: state.waitingCount || 0,
    rooms: state.roomsCount || 0,
    layout: 'layouts/admin'
  });
};
