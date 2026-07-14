/**
 * App-wide constants.
 */
module.exports = {
  MAX_IMAGE_KB: 350,
  MAX_MESSAGE_LEN: 2000,
  GENDERS: ['Male', 'Female', 'Other'],
  PREMIUM_PLANS: [
    { code: 'P10', amount: 10, days: 2, label: '2 Days' },
    { code: 'P20', amount: 20, days: 4, label: '4 Days' },
    { code: 'P30', amount: 30, days: 7, label: '7 Days' },
    { code: 'P99', amount: 99, days: 30, label: '30 Days' },
    { code: 'P599', amount: 599, days: 365, label: '365 Days' }
  ],
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};
