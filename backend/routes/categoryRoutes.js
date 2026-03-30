const express = require('express');
const router = express.Router();
const { getCategories, addCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');
const { auditLogger } = require('../middleware/securityMiddleware');

router.get('/', getCategories);
router.post('/', protect, adminOnly, auditLogger, addCategory);
router.put('/:id', protect, adminOnly, auditLogger, updateCategory);
router.delete('/:id', protect, adminOnly, auditLogger, deleteCategory);

module.exports = router;
