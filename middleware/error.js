/**
 * Global error handler. Renders HTML for browser requests, JSON otherwise.
 */
module.exports = function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);

  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  if (req.originalUrl.startsWith('/api') || req.xhr) {
    return res.status(status).json({ success: false, error: message });
  }

  res.status(status);
  try {
    const seo = require('../config/seo');
    res.render('error', { title: `Error ${status}`, seo: seo.build('home'), status, message });
  } catch (_e) {
    res.type('html').send(`<h1>${status}</h1><p>${message}</p>`);
  }
};
