const express = require('express');
const router = express.Router();
const { createBorrow, returnBook, renewBook, getUserHistory, getAllBorrows, triggerEmailReminders, getBorrowStats } = require('../controllers/borrowController');
const { protect, adminOnly } = require('../middleware/auth');
const { auditLogger } = require('../middleware/securityMiddleware');

router.post('/', protect, adminOnly, auditLogger, createBorrow);
router.post('/:recordId/return', protect, adminOnly, auditLogger, returnBook);
router.patch('/:recordId/renew', protect, adminOnly, auditLogger, renewBook);
router.get('/user/:userId', protect, getUserHistory);
router.get('/', protect, adminOnly, getAllBorrows);

// Stats & Email
router.get('/stats', protect, adminOnly, getBorrowStats);
router.post('/reminders', protect, adminOnly, auditLogger, triggerEmailReminders);

module.exports = router;
