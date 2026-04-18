const express = require('express');
const router = express.Router();
const { getCopiesByBook, addCopy, deleteCopy, updateCopy } = require('../controllers/copyController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/book/:bookId', protect, getCopiesByBook);
router.get('/barcode/:barcode', protect, require('../controllers/copyController').getCopyByBarcode);
router.post('/', protect, adminOnly, addCopy);
router.put('/:id', protect, adminOnly, updateCopy);
router.delete('/:id', protect, adminOnly, deleteCopy);

module.exports = router;
