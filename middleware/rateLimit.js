const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { error: 'Too many auth attempts. Try again later.' }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  message: { error: 'Too many payment requests.' }
});

module.exports = { globalLimiter, authLimiter, paymentLimiter };
