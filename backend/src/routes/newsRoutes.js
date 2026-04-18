const express = require('express');
const router = express.Router();
const News = require('../models/News');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/news - Lấy danh sách tin tức
router.get('/', async (req, res) => {
    try {
        const news = await News.find({ status: 'published' }).sort({ createdAt: -1 });
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// GET /api/news/admin - Admin lấy tất cả
router.get('/admin', protect, adminOnly, async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;
