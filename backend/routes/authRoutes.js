const express = require('express');
const router = express.Router();
const { login, register, getAccounts, createAccount, updateAccount, deleteAccount, toggleStatus, toggleFavorite, getFavorites } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

// Public
router.post('/login', login);
router.post('/admin/login', login);
router.post('/register', register);

// Protected (admin only)
router.get('/accounts', protect, adminOnly, getAccounts);
router.post('/accounts', protect, adminOnly, createAccount);
router.put('/accounts/:id', protect, adminOnly, updateAccount);
router.delete('/accounts/:id', protect, adminOnly, deleteAccount);
router.patch('/accounts/:id/toggle', protect, adminOnly, toggleStatus);
router.patch('/accounts/:id/toggle-status', protect, adminOnly, toggleStatus);

// Favorites
router.get('/favorites', protect, getFavorites);
router.patch('/favorites/:bookId', protect, toggleFavorite);

module.exports = router;
