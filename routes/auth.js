const express = require('express');
const passport = require('passport');
const { body } = require('express-validator');
const c = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/signup', c.getSignup);
router.post(
  '/signup',
  authLimiter,
  [body('email').isEmail(), body('password').isLength({ min: 6 }), body('name').isLength({ min: 2 })],
  c.signup
);

router.get('/login', c.getLogin);
router.post('/login', authLimiter, c.login);

router.get('/logout', c.logout);
router.get('/verify/:token', c.verify);

router.get('/forgot', c.getForgot);
router.post('/forgot', authLimiter, c.forgot);
router.get('/reset/:token', c.getReset);
router.post('/reset/:token', authLimiter, c.reset);

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login', session: true }),
  c.googleSuccess
);

module.exports = router;
