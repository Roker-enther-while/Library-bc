const express = require('express');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../database/connection');
const Book = require('../models/Book');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');

const app = express();
const PORT = 4002;
const JWT_SECRET = 'security_prototype_super_secret_key_2026';

app.use(express.json());

// Console logging middleware
app.use((req, res, next) => {
    console.log(`📦 [Library-Service] ${req.method} ${req.path}`);
    next();
});

// Authentication middleware (Verify JWT)
const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.warn(`🔒 [Library-Service] Unauthorized access attempt: No token provided on path ${req.path}`);
        return res.status(401).json({ success: false, message: 'Không có quyền truy cập! Thiếu token.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Contains id, role, username
        
        // Fetch full user (excluding password) to ensure card status is active
        const dbUser = await User.findById(decoded.id).select('-password');
        if (!dbUser) {
            return res.status(401).json({ success: false, message: 'Người dùng không tồn tại.' });
        }
        
        if (dbUser.cardStatus === 'locked') {
            console.error(`🚨 [Library-Service] Request blocked: User "${dbUser.username}" is LOCKED!`);
            return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa.' });
        }

        req.fullUser = dbUser; // Stores the transparently decrypted user document
        next();
    } catch (err) {
        console.warn(`🔒 [Library-Service] Unauthorized access attempt: Invalid/Expired token on path ${req.path}`);
        return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// Role-based Access Control (RBAC) - Staff only
const staffOnly = (req, res, next) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'librarian') {
        console.error(`🚨 [Library-Service] RBAC Violation: User "${req.user?.username}" (role: ${req.user?.role}) attempted unauthorized access to staff endpoint: ${req.method} ${req.path}`);
        return res.status(403).json({ 
            success: false, 
            message: 'Bạn không có quyền thực hiện hành động này! Chỉ dành cho thủ thư hoặc quản trị viên.' 
        });
    }
    next();
};

// Audit Logger Middleware - Records staff activities
const auditLogger = async (req, res, next) => {
    // We run this after protect & staffOnly, so req.user exists
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    try {
        await SecurityLog.create({
            userId: req.user.id,
            username: req.user.username,
            action: `STAFF_${req.method}_BOOK`,
            level: 'info',
            ip,
            userAgent: req.headers['user-agent'] || 'HTTP-Client',
            path: req.path,
            method: req.method,
            payload: req.body,
            reason: `Staff member "${req.user.username}" performed ${req.method} book operation.`
        });
        console.log(`📝 [Library-Service] [AUDIT LOG] Recorded staff action "${req.method} ${req.path}" by user "${req.user.username}" to MongoDB.`);
    } catch (err) {
        console.error('❌ [Library-Service] Audit logging failed:', err.message);
    }
    next();
};

// --- ENDPOINTS ---

// EndPoint 1: Get books list (Accessible to all authenticated users)
app.get('/books', protect, async (req, res) => {
    try {
        const books = await Book.find({});
        res.json({
            success: true,
            count: books.length,
            data: books
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// EndPoint 2: Add a book (RBAC protected: Admin/Librarian only + Audited)
app.post('/books', protect, staffOnly, auditLogger, async (req, res) => {
    const { title, author, category, isbn } = req.body;
    
    if (!title || !author || !category || !isbn) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin sách.' });
    }

    try {
        const bookExists = await Book.findOne({ isbn });
        if (bookExists) {
            return res.status(400).json({ success: false, message: 'Mã ISBN này đã tồn tại trong thư viện!' });
        }

        const newBook = await Book.create({ title, author, category, isbn });
        console.log(`📚 [Library-Service] Book "${title}" created successfully by Staff "${req.user.username}".`);
        
        res.status(201).json({
            success: true,
            message: 'Thêm sách mới thành công!',
            data: newBook
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// EndPoint 3: Get user's sensitive profile data (Demonstrates AES-256-GCM Transparent Decryption)
app.get('/sensitive-profile', protect, async (req, res) => {
    // req.fullUser contains the decrypted User object from database post-init hook.
    // Let's also fetch the raw database document directly using MongoDB lean() or direct query bypassing mongoose hooks,
    // to prove to the user that it is stored as encrypted ciphertext on the database disk!
    
    try {
        const rawUser = await User.findById(req.user.id).lean();
        
        console.log(`🔐 [Library-Service] [CRYPTO DEMO] User "${req.user.username}" requested sensitive profile.`);
        console.log(`   - Raw Database data (encrypted): phone="${rawUser.phone}", studentId="${rawUser.studentId}"`);
        console.log(`   - Decrypted In-Memory data (in-use): phone="${req.fullUser.phone}", studentId="${req.fullUser.studentId}"`);
        
        res.json({
            success: true,
            message: 'Truy xuất thông tin nhạy cảm thành công!',
            decryptedProfile: {
                username: req.fullUser.username,
                fullName: req.fullUser.fullName,
                email: req.fullUser.email,
                phone: req.fullUser.phone,        // Clear-text decrypted
                studentId: req.fullUser.studentId, // Clear-text decrypted
                role: req.fullUser.role
            },
            encryptedRawInDatabase: {
                phone: rawUser.phone,        // iv:ciphertext:tag
                studentId: rawUser.studentId // iv:ciphertext:tag
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start service
connectDB('Library-Service').then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 [Library-Service] running at http://localhost:${PORT}`);
    });
});
