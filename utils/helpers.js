const crypto = require('crypto');

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

function anonName() {
  const adj = ['Cool', 'Silent', 'Happy', 'Wild', 'Brave', 'Chill', 'Neon', 'Swift', 'Lucky', 'Cosmic'];
  const noun = ['Fox', 'Wolf', 'Panda', 'Tiger', 'Star', 'Ninja', 'Ghost', 'Comet', 'Rider', 'Dragon'];
  return adj[Math.floor(Math.random() * adj.length)] + noun[Math.floor(Math.random() * noun.length)] + Math.floor(Math.random() * 900 + 100);
}

function sanitizeStr(s, max = 200) {
  return String(s || '').replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max).trim();
}

function daysFromNow(days) {
  return new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000);
}

module.exports = { randomToken, anonName, sanitizeStr, daysFromNow };
