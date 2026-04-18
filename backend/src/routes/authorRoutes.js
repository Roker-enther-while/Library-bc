const express = require('express');
const router = express.Router();
const { getAuthors, getAuthorById, addAuthor, updateAuthor, deleteAuthor } = require('../controllers/authorController');
const { protect, adminOnly } = require('../middleware/auth');
const { auditLogger } = require('../middleware/securityMiddleware');

router.get('/', getAuthors);
router.get('/:id', getAuthorById);
router.post('/', protect, adminOnly, auditLogger, addAuthor);
router.put('/:id', protect, adminOnly, auditLogger, updateAuthor);
router.delete('/:id', protect, adminOnly, auditLogger, deleteAuthor);

module.exports = router;
