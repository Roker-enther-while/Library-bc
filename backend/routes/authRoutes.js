const express = require('express');
const router = express.Router();
const { login, adminLogin, register, getAccounts, createAccount, updateAccount, deleteAccount, toggleStatus, toggleFavorite, getFavorites, getSecurityLogs, getMe } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const { auditLogger, threatDetector } = require('../middleware/securityMiddleware');
const { securityService } = require('../middleware/securityMiddleware');

// Public
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/register', register);

// Protected (admin only)
router.get('/accounts', protect, adminOnly, getAccounts);
router.get('/security-logs', protect, adminOnly, getSecurityLogs);
router.post('/accounts', protect, adminOnly, auditLogger, createAccount);
router.put('/accounts/:id', protect, adminOnly, auditLogger, updateAccount);
router.delete('/accounts/:id', protect, adminOnly, auditLogger, deleteAccount);
router.patch('/accounts/:id/toggle', protect, adminOnly, auditLogger, toggleStatus);
router.patch('/accounts/:id/toggle-status', protect, adminOnly, auditLogger, toggleStatus);

// Security reporting endpoint for frontend
router.post('/report-threat', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await securityService.logThreat({
        userId: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANONYMOUS_CLIENT',
        action: 'frontend_behavior_anomaly',
        reason: req.body.reason || 'Suspicious client-side activity',
        ip,
        userAgent: req.headers['user-agent'],
        payload: req.body.details
    });
    res.json({ status: 'logged' });
});

// Favorites
router.get('/me', protect, getMe);
router.get('/favorites', protect, getFavorites);
router.patch('/favorites/:bookId', protect, toggleFavorite);

module.exports = router;
