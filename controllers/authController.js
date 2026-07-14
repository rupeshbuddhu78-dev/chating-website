const { validationResult } = require('express-validator');
const validator = require('validator');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendTokenCookie, clearTokenCookie } = require('../utils/jwt');
const { sendMail } = require('../utils/email');
const { randomToken } = require('../utils/helpers');
const seo = require('../config/seo');

/** GET signup page */
exports.getSignup = (_req, res) =>
  res.render('auth/signup', { title: seo.PAGES.signup.title, seo: seo.build('signup'), error: null });

/** GET login page */
exports.getLogin = (_req, res) =>
  res.render('auth/login', { title: seo.PAGES.login.title, seo: seo.build('login'), error: null });

/** GET forgot page */
exports.getForgot = (_req, res) =>
  res.render('auth/forgot', { title: 'Forgot Password', seo: seo.build('login'), message: null, error: null });

/** GET reset page */
exports.getReset = async (req, res) => {
  const record = await PasswordReset.findOne({ token: req.params.token, used: false, expiresAt: { $gt: new Date() } });
  if (!record) return res.render('error', { title: 'Invalid link', seo: seo.build('home'), status: 400, message: 'Reset link invalid or expired' });
  res.render('auth/reset', { title: 'Reset Password', seo: seo.build('login'), token: req.params.token, error: null });
};

/** POST signup */
exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).render('auth/signup', { title: 'Sign Up', seo: seo.build('signup'), error: errors.array()[0].msg });

    const { name, email, password, gender, country } = req.body;
    if (!validator.isEmail(email)) return res.status(400).render('auth/signup', { title: 'Sign Up', seo: seo.build('signup'), error: 'Invalid email' });
    if (!password || password.length < 6) return res.status(400).render('auth/signup', { title: 'Sign Up', seo: seo.build('signup'), error: 'Password too short' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).render('auth/signup', { title: 'Sign Up', seo: seo.build('signup'), error: 'Email already used' });

    const user = await User.create({
      name: String(name).slice(0, 60),
      email: email.toLowerCase(),
      password,
      gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : '',
      country: String(country || '').slice(0, 60),
      isVerified: false,
      verifyToken: randomToken(16),
      verifyExpiry: new Date(Date.now() + 24 * 3600 * 1000)
    });

    const link = `${process.env.BASE_URL || ''}/auth/verify/${user.verifyToken}`;
    sendMail({
      to: user.email,
      subject: 'Verify your QuickTalk account',
      html: `<p>Hi ${user.name},</p><p>Click to verify: <a href="${link}">${link}</a></p>`
    }).catch(() => {});

    sendTokenCookie(res, user);
    user.lastLogin = new Date();
    await user.save();
    res.redirect('/user/dashboard');
  } catch (err) {
    res.status(500).render('auth/signup', { title: 'Sign Up', seo: seo.build('signup'), error: err.message });
  }
};

/** POST login */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
    if (!user) return res.status(400).render('auth/login', { title: 'Login', seo: seo.build('login'), error: 'Invalid credentials' });
    if (user.banned) return res.status(403).render('auth/login', { title: 'Login', seo: seo.build('login'), error: 'Account banned' });
    const ok = await user.matchPassword(password);
    if (!ok) return res.status(400).render('auth/login', { title: 'Login', seo: seo.build('login'), error: 'Invalid credentials' });
    user.lastLogin = new Date();
    await user.save();
    sendTokenCookie(res, user);
    res.redirect('/user/dashboard');
  } catch (err) {
    res.status(500).render('auth/login', { title: 'Login', seo: seo.build('login'), error: err.message });
  }
};

/** GET logout */
exports.logout = (req, res) => {
  clearTokenCookie(res);
  req.logout?.(() => {});
  res.redirect('/');
};

/** GET email verify */
exports.verify = async (req, res) => {
  const u = await User.findOne({ verifyToken: req.params.token, verifyExpiry: { $gt: new Date() } });
  if (!u) return res.render('error', { title: 'Invalid link', seo: seo.build('home'), status: 400, message: 'Verify link invalid or expired' });
  u.isVerified = true;
  u.verifyToken = undefined;
  u.verifyExpiry = undefined;
  await u.save();
  res.redirect('/user/dashboard?verified=1');
};

/** POST forgot */
exports.forgot = async (req, res) => {
  const email = String(req.body.email || '').toLowerCase();
  const user = await User.findOne({ email });
  if (user) {
    const token = randomToken(20);
    await PasswordReset.create({
      user: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });
    const link = `${process.env.BASE_URL || ''}/auth/reset/${token}`;
    sendMail({
      to: email,
      subject: 'Reset your QuickTalk password',
      html: `<p>Reset link (valid 1h): <a href="${link}">${link}</a></p>`
    }).catch(() => {});
  }
  res.render('auth/forgot', { title: 'Forgot Password', seo: seo.build('login'), message: 'If the email exists, a reset link was sent.', error: null });
};

/** POST reset */
exports.reset = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).render('auth/reset', { title: 'Reset Password', seo: seo.build('login'), token, error: 'Password too short' });
  }
  const record = await PasswordReset.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
  if (!record) return res.render('error', { title: 'Invalid link', seo: seo.build('home'), status: 400, message: 'Reset link invalid or expired' });
  const user = await User.findById(record.user).select('+password');
  if (!user) return res.render('error', { title: 'Invalid user', seo: seo.build('home'), status: 400, message: 'User not found' });
  user.password = password;
  await user.save();
  record.used = true;
  await record.save();
  res.redirect('/auth/login?reset=1');
};

/** Google OAuth success handler */
exports.googleSuccess = (req, res) => {
  if (!req.user) return res.redirect('/auth/login');
  sendTokenCookie(res, req.user);
  res.redirect('/user/dashboard');
};
