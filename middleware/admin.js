const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Admin-only guard using a separate `admin_token` cookie.
 */
module.exports = async function adminProtect(req, res, next) {
  try {
    const token = req.cookies?.admin_token;
    if (!token) return res.redirect('/admin/login');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.redirect('/admin/login');
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.redirect('/admin/login');
    req.admin = admin;
    res.locals.admin = admin;
    next();
  } catch (e) {
    res.clearCookie('admin_token');
    return res.redirect('/admin/login');
  }
};
