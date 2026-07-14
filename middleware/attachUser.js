const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Non-blocking: attach current user (if any) to res.locals so EJS templates
 * always have `user`.
 */
const seo = require('../config/seo');

module.exports = async function attachUser(req, res, next) {
  res.locals.user = null;
  res.locals.currentPath = req.originalUrl;
  // Ensure every view (including admin) has an SEO object by default
  res.locals.seo = seo.build('home');
  try {
    const token = req.cookies?.token;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();
    if (user && !user.banned) {
      req.user = user;
      res.locals.user = user;
    }
  } catch (_e) {
    // ignore
  }
  next();
};
