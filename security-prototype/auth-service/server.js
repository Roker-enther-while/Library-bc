const express = require('express');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../database/connection');
const User = require('../models/User');

const app = express();
const PORT = 4001;
const JWT_SECRET = 'security_prototype_super_secret_key_2026';

app.use(express.json());

// Console log logging middleware
app.use((req, res, next) => {
    console.log(`🔑 [Auth-Service] ${req.method} ${req.path}`);
    next();
});

// Authentication endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp username và password.' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            console.warn(`⚠️ [Auth-Service] Failed login attempt: Username "${username}" not found.`);
            return res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });
        }

        // Check if account is locked due to security violations
        if (user.cardStatus === 'locked') {
            console.error(`🚨 [Auth-Service] Rejected login: Account "${username}" is LOCKED due to multiple security violations!`);
            return res.status(403).json({ 
                success: false, 
                message: 'Tài khoản của bạn đã bị khóa do vi phạm các chính sách bảo mật hệ thống.' 
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.warn(`⚠️ [Auth-Service] Failed login attempt: Incorrect password for user "${username}".`);
            return res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });
        }

        // Issue JWT with user details
        const token = jwt.sign(
            { id: user._id, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log(`✅ [Auth-Service] User "${username}" authenticated successfully. Role: ${user.role}. JWT Issued.`);
        
        res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                cardStatus: user.cardStatus
            }
        });
    } catch (error) {
        console.error('❌ [Auth-Service] Error during login:', error.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Get User Profile (used by other services or client)
app.get('/verify', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        if (user.cardStatus === 'locked') {
            return res.status(403).json({ success: false, message: 'Account is locked' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                cardStatus: user.cardStatus
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token invalid or expired' });
    }
});

// Start service
connectDB('Auth-Service').then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 [Auth-Service] running at http://localhost:${PORT}`);
    });
});
