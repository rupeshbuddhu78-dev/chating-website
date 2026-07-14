const { v4: uuid } = require('uuid');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { PREMIUM_PLANS } = require('../config/constants');
const cashfree = require('../utils/cashfree');
const { daysFromNow } = require('../utils/helpers');

/** POST /payment/create — server-side order creation. */
exports.createOrder = async (req, res) => {
  try {
    const { planCode } = req.body;
    const plan = PREMIUM_PLANS.find((p) => p.code === planCode);
    if (!plan) return res.status(400).json({ success: false, error: 'Invalid plan' });

    // Duplicate protection: prevent multiple pending orders per user for same plan within 2 min
    const recent = await Payment.findOne({
      user: req.user._id,
      planCode,
      status: { $in: ['CREATED', 'PENDING'] },
      createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) }
    });
    if (recent) return res.json({ success: true, orderId: recent.orderId, reused: true });

    const orderId = 'QT_' + Date.now() + '_' + uuid().slice(0, 8);
    const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const cf = await cashfree.createOrder({
      orderId,
      amount: plan.amount,
      customer: {
        id: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email
      },
      returnUrl: `${base}/payment/return`,
      notifyUrl: `${base}/payment/webhook`
    });

    await Payment.create({
      user: req.user._id,
      orderId,
      cfOrderId: cf.order_id,
      planCode: plan.code,
      amount: plan.amount,
      days: plan.days,
      status: 'CREATED',
      raw: cf
    });

    return res.json({
      success: true,
      orderId,
      paymentSessionId: cf.payment_session_id,
      env: (process.env.CASHFREE_ENV || 'PROD').toUpperCase()
    });
  } catch (err) {
    console.error('[Payment.create]', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data?.message || err.message });
  }
};

/** GET /payment/return — user redirected here after Cashfree checkout. */
exports.paymentReturn = async (req, res) => {
  const orderId = req.query.order_id;
  if (!orderId) return res.redirect('/user/dashboard');
  try {
    const cf = await cashfree.getOrder(orderId);
    const payment = await Payment.findOne({ orderId });
    if (!payment) return res.redirect('/user/dashboard');

    if (cf.order_status === 'PAID' && payment.status !== 'PAID') {
      await activatePremium(payment, cf);
    } else if (cf.order_status === 'EXPIRED' || cf.order_status === 'CANCELLED') {
      payment.status = 'CANCELLED';
      await payment.save();
    }
  } catch (e) {
    console.error('[Payment.return]', e.message);
  }
  res.redirect('/dashboard?payment=done');
};

/** POST /payment/webhook — Cashfree webhook (signature verified). */
exports.webhook = async (req, res) => {
  try {
    const rawBody = req.rawBody; // set by express.raw middleware in route
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    if (!cashfree.verifyWebhookSignature(rawBody, timestamp, signature)) {
      console.warn('[Webhook] invalid signature');
      return res.status(401).send('invalid signature');
    }
    const evt = JSON.parse(rawBody.toString('utf8'));
    const orderId = evt?.data?.order?.order_id;
    if (!orderId) return res.status(200).send('ok');

    const payment = await Payment.findOne({ orderId });
    if (!payment) return res.status(200).send('ok');

    const status = evt?.data?.order?.order_status || evt?.type;
    if (status === 'PAID' || evt.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      if (payment.status !== 'PAID') {
        await activatePremium(payment, evt.data);
      }
    } else if (status === 'FAILED' || evt.type === 'PAYMENT_FAILED_WEBHOOK') {
      payment.status = 'FAILED';
      payment.raw = evt;
      await payment.save();
    }
    res.status(200).send('ok');
  } catch (err) {
    console.error('[Webhook]', err.message);
    res.status(500).send('err');
  }
};

/** Mark payment as PAID + extend user's premium. */
async function activatePremium(payment, raw) {
  payment.status = 'PAID';
  payment.raw = raw;
  payment.activatedAt = new Date();
  await payment.save();

  const user = await User.findById(payment.user);
  if (!user) return;
  const base = user.activePremium() ? user.premiumExpiry.getTime() : Date.now();
  user.isPremium = true;
  user.premiumPlan = payment.planCode;
  user.premiumExpiry = new Date(base + payment.days * 24 * 3600 * 1000);
  await user.save();
  console.log(`[Premium] Activated ${payment.planCode} for ${user.email} until ${user.premiumExpiry.toISOString()}`);
}
