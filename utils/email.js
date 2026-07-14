const nodemailer = require('nodemailer');

let transporter = null;
function getTransport() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const t = getTransport();
  if (!t) {
    console.warn('[Email] SMTP not configured — skipping mail to', to);
    return { skipped: true };
  }
  return t.sendMail({
    from: process.env.SMTP_FROM || 'QuickTalk <no-reply@livegirlschat.online>',
    to,
    subject,
    html,
    text
  });
}

module.exports = { sendMail };
