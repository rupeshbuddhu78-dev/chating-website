const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect route (requires valid JWT cookie or Authorization header).
 */
async function protect(req, res, next) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return unauthorized(req, res);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return unauthorized(req, res);
    if (user.banned) {
      return req.originalUrl.startsWith('/api')
        ? res.status(403).json({ success: false, error: 'Account banned' })
        : res.status(403).render('error', { title: 'Banned', status: 403, message: 'Account banned' });
    }
    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    unauthorized(req, res);
  }
}

function unauthorized(req, res) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  return res.redirect('/auth/login');
}

/** Require premium subscription. */
function requirePremium(req, res, next) {
  const u = req.user;
  if (u?.isPremium && u.premiumExpiry && u.premiumExpiry > new Date()) return next();
  if (req.originalUrl.startsWith('/api')) {
    return res.status(402).json({ success: false, error: 'Premium required' });
  }
  return res.redirect('/user/premium');
}

module.exports = { protect, requirePremium };
