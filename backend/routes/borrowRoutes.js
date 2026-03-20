const express = require('express');
const router = express.Router();
const { createBorrow, returnBook, getUserHistory, getAllBorrows, triggerEmailReminders, getBorrowStats } = require('../controllers/borrowController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, adminOnly, createBorrow);
router.post('/:recordId/return', protect, adminOnly, returnBook);
router.get('/user/:userId', protect, getUserHistory);
router.get('/', protect, adminOnly, getAllBorrows);

// Stats & Email
router.get('/stats', protect, adminOnly, getBorrowStats);
router.post('/reminders', protect, adminOnly, triggerEmailReminders);

module.exports = router;
