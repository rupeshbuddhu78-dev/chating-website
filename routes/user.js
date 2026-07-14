const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const c = require('../controllers/userController');

const router = express.Router();
router.use(protect);

router.get('/dashboard', c.dashboard);
router.get('/premium', c.premiumPage);
router.get('/profile', c.profilePage);
router.post('/profile', upload.single('profileImage'), c.updateProfile);
router.post('/password', c.changePassword);
router.get('/payments', c.paymentsPage);

module.exports = router;
