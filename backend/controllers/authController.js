const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id, role) => {
    const expiresIn = (role === 'admin' || role === 'librarian') ? '4h' : '7d';
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
    studentId: user.studentId,
    cardStatus: user.cardStatus,
    penalties: user.penalties || 0,
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '',
});

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });

        const user = await User.findOne({ username });
        if (!user)
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng!' });

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
        user.status = user.status === 'active' ? 'inactive' : 'active';
        await user.save();
        res.json(transformUser(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
