const express = require('express');
const router = express.Router();
const { getBooks, getBookById, getChapter, saveReadingProgress, getReadingProgress, addBook, updateBook, deleteBook, searchBooks, getAdminStats } = require('../controllers/bookController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats', protect, adminOnly, getAdminStats);
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// Áp dụng Caching (bộ đệm In-Memory) cho các API lấy dữ liệu tĩnh
router.get('/search', cacheMiddleware, searchBooks);
router.get('/', cacheMiddleware, getBooks);
router.get('/:id/chapters/:chapterNumber', cacheMiddleware, getChapter);
router.route('/:id/progress').get(protect, getReadingProgress).post(protect, saveReadingProgress);
router.get('/:id', cacheMiddleware, getBookById);

// Thêm hooks clearCache sau khi thay đổi dữ liệu (nâng cao)
router.post('/', protect, adminOnly, (req, res, next) => { clearCache('/api/books'); next(); }, addBook);
router.put('/:id', protect, adminOnly, (req, res, next) => { clearCache('/api/books'); next(); }, updateBook);
router.delete('/:id', protect, adminOnly, (req, res, next) => { clearCache('/api/books'); next(); }, deleteBook);

module.exports = router;
