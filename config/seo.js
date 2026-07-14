/**
 * Centralized SEO metadata per route.
 * Used by pagesController + layouts to render proper <head> tags.
 */
const BASE_URL = process.env.BASE_URL || 'https://livegirlschat.online';
const SITE_NAME = 'QuickTalk';
const DEFAULT_IMAGE = BASE_URL + '/images/og-image.svg';

const DEFAULT_KEYWORDS = [
  'random video chat',
  'omegle alternative',
  'ometv alternative',
  'chatroulette alternative',
  'anonymous chat',
  'talk to strangers',
  'free video chat',
  'girls video chat',
  'live girls chat',
  'random chat online',
  'stranger chat',
  'webrtc chat',
  'voice chat online',
  'live cam chat',
  'text chat with strangers'
].join(', ');

const PAGES = {
  home: {
    title: 'QuickTalk — Free Anonymous Random Video, Voice & Text Chat',
    description:
      'QuickTalk is a free anonymous random chat site — meet strangers instantly with HD video, voice or text. Better than Omegle, OmeTV & Chatroulette. Start chatting in one click.',
    path: '/',
    priority: '1.0',
    changefreq: 'daily'
  },
  chat: {
    title: 'Start Random Chat — Video, Voice & Text | QuickTalk',
    description:
      'Start a random anonymous chat now. Talk to strangers worldwide with HD video, voice, or text. No signup needed.',
    path: '/chat',
    priority: '0.95',
    changefreq: 'daily'
  },
  about: {
    title: 'About QuickTalk — Anonymous Random Chat Platform',
    description:
      'Learn about QuickTalk — the fastest anonymous random chat platform for text, voice and HD video conversations.',
    path: '/about',
    priority: '0.6',
    changefreq: 'monthly'
  },
  terms: {
    title: 'Terms of Service | QuickTalk',
    description: 'Terms of Service for using QuickTalk anonymous random chat platform.',
    path: '/terms',
    priority: '0.3',
    changefreq: 'yearly'
  },
  privacy: {
    title: 'Privacy Policy | QuickTalk',
    description:
      'QuickTalk respects your privacy. Chats are not stored; media flows peer-to-peer via WebRTC.',
    path: '/privacy',
    priority: '0.3',
    changefreq: 'yearly'
  },
  contact: {
    title: 'Contact QuickTalk Support',
    description: 'Contact QuickTalk support team for help, refunds, safety and moderation.',
    path: '/contact',
    priority: '0.4',
    changefreq: 'yearly'
  },
  login: {
    title: 'Login to QuickTalk',
    description: 'Login to your QuickTalk account for premium filters, priority matching and HD video.',
    path: '/auth/login',
    priority: '0.5',
    changefreq: 'monthly'
  },
  signup: {
    title: 'Sign Up — Create Free QuickTalk Account',
    description: 'Create a free QuickTalk account to enjoy premium features, safer chat and no ads.',
    path: '/auth/signup',
    priority: '0.5',
    changefreq: 'monthly'
  },
  premium: {
    title: 'QuickTalk Premium — HD Video, Filters & Priority Matching',
    description:
      'Upgrade to QuickTalk Premium for HD video, gender & country filters, priority matching and ad-free chat. Plans from ₹10.',
    path: '/user/premium',
    priority: '0.8',
    changefreq: 'weekly'
  }
};

function build(key) {
  const p = PAGES[key] || PAGES.home;
  return {
    ...p,
    url: BASE_URL + p.path,
    image: DEFAULT_IMAGE,
    keywords: DEFAULT_KEYWORDS,
    siteName: SITE_NAME,
    baseUrl: BASE_URL
  };
}

module.exports = { PAGES, build, BASE_URL, SITE_NAME, DEFAULT_IMAGE, DEFAULT_KEYWORDS };
