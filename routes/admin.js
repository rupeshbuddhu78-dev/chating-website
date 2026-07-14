const express = require('express');
const adminProtect = require('../middleware/admin');
const c = require('../controllers/adminController');

const router = express.Router();

router.get('/login', c.loginPage);
router.post('/login', c.doLogin);
router.get('/logout', c.logout);

router.use(adminProtect);

router.get('/', c.dashboard);
router.get('/users', c.users);
router.post('/users/:id/ban', c.banUser);
router.post('/users/:id/unban', c.unbanUser);
router.post('/users/:id/delete', c.deleteUser);
router.post('/users/:id/premium/give', c.givePremium);
router.post('/users/:id/premium/remove', c.removePremium);

router.get('/payments', c.payments);
router.get('/payments.csv', c.exportPaymentsCSV);

router.get('/reports', c.reports);
router.post('/reports/:id', c.actionReport);

router.get('/settings', c.settingsPage);
router.post('/settings', c.saveSettings);

router.get('/chat', c.chatStatus);

module.exports = router;
