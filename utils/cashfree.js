/**
 * Cashfree Payment Gateway v2022-09-01 wrapper.
 * Handles order creation, order lookup and webhook signature verification.
 */
const axios = require('axios');
const crypto = require('crypto');

const API_VERSION = '2022-09-01';

function baseUrl() {
  const env = (process.env.CASHFREE_ENV || 'PROD').toUpperCase();
  return env === 'PROD' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
}

function headers() {
  return {
    'x-api-version': API_VERSION,
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
    'Content-Type': 'application/json'
  };
}

/** Create an order and return payment session id. */
async function createOrder({ orderId, amount, currency = 'INR', customer, returnUrl, notifyUrl }) {
  const body = {
    order_id: orderId,
    order_amount: Number(amount),
    order_currency: currency,
    customer_details: {
      customer_id: customer.id,
      customer_name: customer.name || 'QuickTalk User',
      customer_email: customer.email,
      customer_phone: customer.phone || '9999999999'
    },
    order_meta: {
      return_url: `${returnUrl}?order_id={order_id}`,
      notify_url: notifyUrl
    }
  };
  const { data } = await axios.post(`${baseUrl()}/orders`, body, { headers: headers() });
  return data;
}

async function getOrder(orderId) {
  const { data } = await axios.get(`${baseUrl()}/orders/${orderId}`, { headers: headers() });
  return data;
}

/**
 * Verify Cashfree webhook signature.
 * signature = base64( HMAC_SHA256( timestamp + rawBody, secret ) )
 */
function verifyWebhookSignature(rawBody, timestamp, signature) {
  const secret = process.env.CASHFREE_SECRET_KEY || '';
  const payload = String(timestamp) + (typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'));
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
  } catch (_e) {
    return false;
  }
}

module.exports = { createOrder, getOrder, verifyWebhookSignature };
