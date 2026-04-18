const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protect, adminOnly } = require('../middleware/auth');

// Configure Cloudinary (reads from .env automatically if cloudinary is configured)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'thuvien',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});

const upload = multer({ storage });

router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Chưa đính kèm file ảnh' });
        }
        // req.file.path chứa URL ảnh trả về từ Cloudinary
        res.json({ success: true, url: req.file.path });
    } catch (error) {
        console.error('Lỗi upload ảnh:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
