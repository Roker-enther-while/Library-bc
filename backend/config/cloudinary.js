const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn("⚠️ CẢNH BÁO: Chưa cấu hình CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong file .env");
    console.warn("Vui lòng thêm các khóa này để tính năng Image Upload hoạt động.");
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'thuvien_uploads',
        allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
        transformation: [{ width: 500, crop: 'limit' }]
    }
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
