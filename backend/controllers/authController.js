const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Book = require('../models/Book');
const securityRepo = require('../repositories/SecurityRepository');

const generateToken = (id, role) => {
    const expiresIn = (role === 'admin' || role === 'librarian') ? '4h' : '1d';
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn });
};

const transformUser = (user) => ({
    id: user._id.toString(),
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    cardStatus: user.cardStatus,
    penalties: user.penalties || 0,
    maxBorrowLimit: user.maxBorrowLimit || 5,
    favorites: user.favorites || [],
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '',
});

// Shared Login Logic Helper
const performLogin = async (req, res, isAdminOnly = false) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });

        const user = await User.findOne({ username });
        if (!user)
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng!' });

        if (isAdminOnly && user.role !== 'admin' && user.role !== 'librarian')
            return res.status(403).json({ message: 'Bạn không có quyền truy nhập vào trang quản trị!' });

        if (user.status === 'inactive')
            return res.status(401).json({ message: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin!' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch)
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng!' });

        res.json({
            token: generateToken(user._id, user.role),
            user: transformUser(user),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// POST /api/auth/login
exports.login = async (req, res) => {
    await performLogin(req, res);
};

// POST /api/auth/admin/login
exports.adminLogin = async (req, res) => {
    await performLogin(req, res, true);
};

// POST /api/auth/register (public)
exports.register = async (req, res) => {
    try {
        const { username, password, fullName, email, studentId, phone } = req.body;
        if (!username || !password || !fullName)
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin bắt buộc!' });

        const existing = await User.findOne({ username });
        if (existing)
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });

        const user = await User.create({ username, password, fullName, email, studentId, phone, role: 'reader' });
        res.status(201).json({
            token: generateToken(user._id, user.role),
            user: transformUser(user),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/accounts (admin only)
exports.getAccounts = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json(users.map(transformUser));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/accounts (admin only)
exports.createAccount = async (req, res) => {
    try {
        const { username, password, fullName, email, phone, role } = req.body;
        const existing = await User.findOne({ username });
        if (existing)
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });

        const user = await User.create({ username, password, fullName, email, phone, role });
        res.status(201).json(transformUser(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/auth/accounts/:id (admin only)
exports.updateAccount = async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });

        Object.assign(user, rest);
        if (password) user.password = password; // triggers bcrypt pre-save hook
        await user.save();
        res.json(transformUser(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/auth/accounts/:id (admin only)
exports.deleteAccount = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        res.json({ message: 'Đã xóa tài khoản!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/auth/accounts/:id/toggle (admin only)
exports.toggleStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });

        // Toggle both overall status and card status for consistency
        const isActive = user.status === 'active';
        user.status = isActive ? 'inactive' : 'active';
        user.cardStatus = isActive ? 'locked' : 'active';

        console.log(`[BACKEND] Toggling status for user ${user.username}: ${isActive} -> ${!isActive}`);
        await user.save();

        const transformed = transformUser(user);
        res.json(transformed);
    } catch (error) {
        console.error('[BACKEND-ERROR] Toggle status failed:', error);
        res.status(500).json({
            message: 'Lỗi máy chủ khi cập nhật trạng thái!',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// PATCH /api/auth/favorites/:bookId (authenticated)
exports.toggleFavorite = async (req, res) => {
    try {
        const { bookId } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại!' });

        if (!user.favorites) user.favorites = [];

        const index = user.favorites.indexOf(bookId);
        if (index > -1) {
            user.favorites.splice(index, 1);
        } else {
            user.favorites.push(bookId);
        }

        await user.save();
        res.json({ favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/favorites (authenticated)
exports.getFavorites = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Không có quyền truy cập!' });

        const favoriteIds = user.favorites || [];
        console.log(`[Favorites] Checking favorites for ${user.username}:`, favoriteIds);

        if (favoriteIds.length === 0) return res.json([]);

        if (!Book) {
            throw new Error('Book model is not loaded correctly!');
        }

        const books = await Book.find({
            $or: [
                { _id: { $in: favoriteIds } },
                { id: { $in: favoriteIds } }
            ]
        });

        res.json(books);
    } catch (error) {
        console.error('getFavorites error:', error);
        res.status(500).json({
            message: error.message,
            stack: error.stack
        });
    }
};

// GET /api/auth/me (authenticated)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        res.json(transformUser(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/security-logs (admin only)
exports.getSecurityLogs = async (req, res) => {
    try {
        const logs = await securityRepo.findLatest(200);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
