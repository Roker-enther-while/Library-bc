const BorrowRecord = require('../models/BorrowRecord');
const Book = require('../models/Book');
const User = require('../models/User');
const Copy = require('../models/Copy');
const { sendDueReminders } = require('../services/cronJobs');
const mongoose = require('mongoose');

// Create Borrow Record (Circulation)
exports.createBorrow = async (req, res) => {
    try {
        const { userId, bookId, days } = req.body;

        // Check user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy độc giả!' });
        if (user.cardStatus === 'locked') return res.status(403).json({ message: 'Thẻ độc giả đang bị khóa!' });

        // Check book availability
        const book = await Book.findById(bookId);
        if (!book || book.available <= 0) {
            return res.status(400).json({ message: 'Sách hiện đã hết trong kho!' });
        }

        // Find an available copy
        const copy = await Copy.findOne({ book: bookId, status: 'available' });

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (days || 14));

        const record = await BorrowRecord.create({
            user: userId,
            book: bookId,
            librarianId: req.user?.id || null, // Capture librarian ID from request user
            dueDate,
            status: 'borrowing'
        });

        // Update book count
        book.available -= 1;
        await book.save();

        // Update copy status if exists
        if (copy) {
            copy.status = 'borrowed';
            await copy.save();
        }

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Return Book
exports.returnBook = async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await BorrowRecord.findById(recordId);
        if (!record || record.status === 'returned') {
            return res.status(400).json({ message: 'Phiếu mượn không hợp lệ hoặc đã trả!' });
        }

        record.returnDate = new Date();
        record.status = 'returned';

        // Calculate fines if overdue
        if (record.returnDate > record.dueDate) {
            const diffTime = Math.abs(record.returnDate - record.dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            record.fineAmount = diffDays * 5000; // 5k per day
        }

        await record.save();

        // Update book count
        const book = await Book.findById(record.book);
        if (book) {
            book.available += 1;
            await book.save();
        }

        // Update copy status
        const copy = await Copy.findOne({ book: record.book, status: 'borrowed' });
        if (copy) {
            copy.status = 'available';
            await copy.save();
        }

        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get User Borrow History
exports.getUserHistory = async (req, res) => {
    try {
        const history = await BorrowRecord.find({ user: req.params.userId })
            .populate('book', 'title coverImage author category')
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Active Borrows (Admin)
exports.getAllBorrows = async (req, res) => {
    try {
        const borrows = await BorrowRecord.find({})
            .populate('user', 'fullName studentId phone')
            .populate('book', 'title author category')
            .sort({ borrowDate: -1 });
        res.json(borrows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Thống kê mượn sách cho Admin Dashboard
exports.getBorrowStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 1. Top 10 sách mượn nhiều nhất tháng này
        const topBooksRaw = await BorrowRecord.aggregate([
            { $match: { borrowDate: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: '$book', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'bookInfo' } }
        ]);

        const topBooks = topBooksRaw.map(item => ({
            bookTitle: item.bookInfo[0]?.title || 'Không rõ',
            count: item.count
        }));

        // 2. Lượt mượn + trả theo ngày (30 ngày gần nhất)
        const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const [dailyBorrowsRaw, dailyReturnsRaw] = await Promise.all([
            BorrowRecord.aggregate([
                { $match: { borrowDate: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$borrowDate' } }, borrowed: { $sum: 1 } } }
            ]),
            BorrowRecord.aggregate([
                { $match: { returnDate: { $gte: thirtyDaysAgo }, status: 'returned' } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$returnDate' } }, returned: { $sum: 1 } } }
            ])
        ]);

        const dateMap = {};
        dailyBorrowsRaw.forEach(d => dateMap[d._id] = { borrowed: d.borrowed, returned: 0 });
        dailyReturnsRaw.forEach(d => {
            if (dateMap[d._id]) dateMap[d._id].returned = d.returned;
            else dateMap[d._id] = { borrowed: 0, returned: d.returned };
        });

        const dailyBorrows = Object.keys(dateMap).sort().map(d => ({
            date: new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            borrowed: dateMap[d].borrowed,
            returned: dateMap[d].returned
        }));

        // 3. Phân bổ theo thể loại
        const categoryStatsRaw = await BorrowRecord.aggregate([
            { $match: { borrowDate: { $gte: startOfMonth } } },
            { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'bookInfo' } },
            { $unwind: '$bookInfo' },
            { $group: { _id: '$bookInfo.category', count: { $sum: 1 } } }
        ]);

        const categoryDistribution = categoryStatsRaw.map(c => ({ category: c._id || 'Khác', count: c.count }));

        // 4. Summary
        const [totalThisMonth, returnedThisMonth, overdueCount] = await Promise.all([
            BorrowRecord.countDocuments({ borrowDate: { $gte: startOfMonth } }),
            BorrowRecord.countDocuments({ returnDate: { $gte: startOfMonth }, status: 'returned' }),
            BorrowRecord.countDocuments({ status: 'overdue' })
        ]);

        res.json({ topBooks, dailyBorrows, categoryDistribution, summary: { totalThisMonth, returnedThisMonth, overdueCount } });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy thống kê' });
    }
};

// Trigger Email Reminders manually
exports.triggerEmailReminders = async (req, res) => {
    try {
        const result = await sendDueReminders();
        res.json({ message: 'Đã hoàn thành gửi email nhắc nhở', ...result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBorrow: exports.createBorrow,
    returnBook: exports.returnBook,
    getUserHistory: exports.getUserHistory,
    getAllBorrows: exports.getAllBorrows,
    triggerEmailReminders: exports.triggerEmailReminders,
    getBorrowStats: exports.getBorrowStats
};
