module.exports = function notFound(req, res) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  const seo = require('../config/seo');
  res.status(404).render('error', { title: 'Not Found', seo: seo.build('home'), status: 404, message: 'Page not found' });
};
