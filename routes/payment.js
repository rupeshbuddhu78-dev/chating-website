const express = require('express');
const { protect } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimit');
const c = require('../controllers/paymentController');

const router = express.Router();

// Webhook needs raw body for signature verification — declared BEFORE json parser
router.post(
  '/webhook',
  express.raw({ type: '*/*', limit: '500kb' }),
  (req, _res, next) => {
    req.rawBody = req.body;
    next();
  },
  c.webhook
);

router.post('/create', protect, paymentLimiter, c.createOrder);
router.get('/return', protect, c.paymentReturn);

module.exports = router;
