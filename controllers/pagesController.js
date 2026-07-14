const seo = require('../config/seo');
const { ICE_SERVERS } = require('../config/constants');

const HOME_FAQ = [
  { q: 'Is QuickTalk free?', a: 'Yes. Random text, voice and video chat are 100% free. Premium plans add filters, priority matching and HD video.' },
  { q: 'Do I need to sign up?', a: 'No, you can chat instantly without an account. Sign up only if you want to save preferences or subscribe to premium.' },
  { q: 'Is my chat private?', a: 'Yes. Text is relayed via encrypted sockets and video/voice flows peer-to-peer over WebRTC. Chats are not stored.' },
  { q: 'Is QuickTalk better than Omegle or OmeTV?', a: 'QuickTalk offers HD video, gender and country filters, priority matching for premium users, plus modern moderation tools.' },
  { q: 'What are the premium prices?', a: 'Plans start at ₹10 for 2 days and go up to ₹599 for 365 days, payable through Cashfree (UPI, cards, netbanking, wallets).' }
];

exports.home = (_req, res) => {
  res.render('pages/home', {
    title: seo.PAGES.home.title,
    seo: seo.build('home'),
    breadcrumbs: [{ name: 'Home', path: '/' }],
    faq: HOME_FAQ
  });
};

exports.about = (_req, res) => {
  res.render('pages/about', {
    title: seo.PAGES.about.title,
    seo: seo.build('about'),
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]
  });
};

exports.terms = (_req, res) =>
  res.render('pages/terms', {
    title: seo.PAGES.terms.title,
    seo: seo.build('terms'),
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Terms', path: '/terms' }]
  });

exports.privacy = (_req, res) =>
  res.render('pages/privacy', {
    title: seo.PAGES.privacy.title,
    seo: seo.build('privacy'),
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Privacy', path: '/privacy' }]
  });

exports.contact = (_req, res) =>
  res.render('pages/contact', {
    title: seo.PAGES.contact.title,
    seo: seo.build('contact'),
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]
  });

exports.chatPage = (req, res) => {
  const iceServers = [...ICE_SERVERS];
  if (process.env.TURN_URL) {
    iceServers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD
    });
  }
  res.render('pages/chat', {
    title: seo.PAGES.chat.title,
    seo: seo.build('chat'),
    iceServers: JSON.stringify(iceServers),
    layout: 'layouts/chat'
  });
};
