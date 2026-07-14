const jwt = require('jsonwebtoken');

function signToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || '30d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/** Set JWT cookie for a user. */
function sendTokenCookie(res, user, opts = {}) {
  const token = signToken({ id: user._id.toString() });
  const days = Number(process.env.COOKIE_EXPIRES_IN || 30);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
    ...opts
  });
  return token;
}

function clearTokenCookie(res) {
  res.clearCookie('token');
}

module.exports = { signToken, sendTokenCookie, clearTokenCookie };
