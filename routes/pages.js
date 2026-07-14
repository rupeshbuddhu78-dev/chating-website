const express = require('express');
const router = express.Router();
const c = require('../controllers/pagesController');
const seoCfg = require('../config/seo');

router.get('/', c.home);
router.get('/chat', c.chatPage);
router.get('/about', c.about);
router.get('/terms', c.terms);
router.get('/privacy', c.privacy);
router.get('/contact', c.contact);

/* ============ SEO endpoints ============ */

// robots.txt
router.get('/robots.txt', (_req, res) => {
  const base = seoCfg.BASE_URL;
  const body = [
    '# QuickTalk robots.txt',
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /auth/reset',
    'Disallow: /auth/verify',
    'Disallow: /api/',
    'Disallow: /payment/',
    'Disallow: /user/',
    'Disallow: /uploads/',
    '',
    '# Allow important marketing pages',
    'Allow: /chat',
    'Allow: /about',
    'Allow: /terms',
    'Allow: /privacy',
    'Allow: /contact',
    '',
    '# Block bad bots',
    'User-agent: AhrefsBot',
    'Disallow: /',
    'User-agent: SemrushBot',
    'Disallow: /',
    'User-agent: MJ12bot',
    'Disallow: /',
    'User-agent: DotBot',
    'Disallow: /',
    '',
    'Crawl-delay: 1',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    `Host: ${base.replace(/^https?:\/\//, '')}`
  ].join('\n');
  res.type('text/plain').send(body);
});

// sitemap.xml
router.get('/sitemap.xml', (_req, res) => {
  const base = seoCfg.BASE_URL;
  const today = new Date().toISOString().split('T')[0];
  const urls = Object.values(seoCfg.PAGES);
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n` +
          `    <loc>${base}${u.path}</loc>\n` +
          `    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority}</priority>\n` +
          `    <xhtml:link rel="alternate" hreflang="en" href="${base}${u.path}" />\n` +
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${base}${u.path}" />\n` +
          `  </url>`
      )
      .join('\n') +
    `\n</urlset>`;
  res.type('application/xml').send(xml);
});

// sitemap index (optional, single sub-sitemap)
router.get('/sitemap-index.xml', (_req, res) => {
  const base = seoCfg.BASE_URL;
  const today = new Date().toISOString().split('T')[0];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <sitemap><loc>${base}/sitemap.xml</loc><lastmod>${today}</lastmod></sitemap>\n` +
    `</sitemapindex>`;
  res.type('application/xml').send(xml);
});

// PWA manifest
router.get('/manifest.json', (_req, res) => {
  res.json({
    name: 'QuickTalk — Anonymous Random Chat',
    short_name: 'QuickTalk',
    description: 'Free anonymous random text, voice and video chat with strangers worldwide.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0f17',
    theme_color: '#0b0f17',
    lang: 'en',
    dir: 'ltr',
    categories: ['social', 'communication', 'lifestyle'],
    icons: [
      { src: '/images/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/images/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ],
    shortcuts: [
      { name: 'Start Chat', url: '/chat', icons: [{ src: '/images/favicon.svg', sizes: 'any' }] },
      { name: 'Premium', url: '/user/premium', icons: [{ src: '/images/favicon.svg', sizes: 'any' }] }
    ]
  });
});

// browserconfig.xml (Microsoft tiles)
router.get('/browserconfig.xml', (_req, res) => {
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/images/icon-192.png"/>
      <TileColor>#0b0f17</TileColor>
    </tile>
  </msapplication>
</browserconfig>`
  );
});

// humans.txt
router.get('/humans.txt', (_req, res) => {
  res.type('text/plain').send(
    `/* TEAM */
QuickTalk Team
Site: ${seoCfg.BASE_URL}
Contact: support@livegirlschat.online

/* SITE */
Standards: HTML5, CSS3, WebRTC, Socket.IO
Components: Node.js, Express, MongoDB, EJS
`
  );
});

// ads.txt (empty by default — fill when running ads)
router.get('/ads.txt', (_req, res) => {
  res.type('text/plain').send('# QuickTalk ads.txt\n# Add ad partners here.\n');
});

// security.txt
router.get('/.well-known/security.txt', (_req, res) => {
  res.type('text/plain').send(
    `Contact: mailto:security@livegirlschat.online
Expires: ${new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()}
Preferred-Languages: en, hi
Canonical: ${seoCfg.BASE_URL}/.well-known/security.txt
`
  );
});

module.exports = router;
