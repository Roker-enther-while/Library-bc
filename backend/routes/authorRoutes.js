const express = require('express');
const router = express.Router();
const { getAuthors, getAuthorById, addAuthor, updateAuthor, deleteAuthor } = require('../controllers/authorController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getAuthors);
router.get('/:id', getAuthorById);
router.post('/', protect, adminOnly, addAuthor);
router.put('/:id', protect, adminOnly, updateAuthor);
router.delete('/:id', protect, adminOnly, deleteAuthor);

module.exports = router;
