const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Không có quyền truy cập!' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) return res.status(401).json({ message: 'Token không hợp lệ!' });
        next();
    } catch {
        res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'librarian')
        return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này!' });
    next();
};

module.exports = { protect, adminOnly };
