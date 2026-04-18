const BorrowServiceClass = require('../services/borrowService');
const bookRepo = require('../repositories/BookRepository');
const borrowRepo = require('../repositories/BorrowRepository');
const BorrowRecord = require('../models/BorrowRecord');
const Book = require('../models/Book');

const borrowService = new BorrowServiceClass(bookRepo, borrowRepo);

const { sendDueReminders } = require('../services/cronJobs');
const mongoose = require('mongoose');

// Transform record for frontend consistency
const transformRecord = (record) => {
    if (!record) return null;
    const obj = record.toObject ? record.toObject() : record;

    // Live fine calculation for unreturned records
    let liveFine = obj.fineAmount || 0;
    if (obj.status !== 'returned' && record.calculateFine) {
        liveFine = record.calculateFine();
    }

    return {
        ...obj,
        id: obj._id,
        fineAmount: liveFine,
        bookTitle: obj.book?.title || obj.bookTitle || 'Không rõ',
        borrowerName: obj.user?.fullName || obj.borrowerName || 'Không rõ',
        borrowerPhone: obj.user?.phone || obj.borrowerPhone || '',
        borrowerStudentId: obj.user?.studentId || obj.borrowerStudentId || ''
    };
};

// Create Borrow Record (Circulation) using Service
exports.createBorrow = async (req, res) => {
    try {
        const { userId, bookId, days } = req.body;
        const librarianId = req.user?.id || req.user?._id || null;

        const record = await borrowService.createBorrow(userId, bookId, days, librarianId);
        res.status(201).json(transformRecord(record));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// Return Book using Service
exports.returnBook = async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await borrowService.returnBook(recordId);
        res.json(transformRecord(record));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.renewBook = async (req, res) => {
    try {
        const { recordId } = req.params;
        const { days } = req.body;
        const record = await borrowService.renewBook(recordId, days);
        res.json(transformRecord(record));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// Get User Borrow History
exports.getUserHistory = async (req, res) => {
    try {
        const history = await borrowService.getUserHistory(req.params.userId);
        res.json(history.map(transformRecord));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Active Borrows (Admin)
exports.getAllBorrows = async (req, res) => {
    try {
        const borrows = await borrowService.getAllBorrows();
        res.json(borrows.map(transformRecord));
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

        console.log(`[BACKEND] Fetching stats for: ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`);

        // 1. Top 10 sách mượn nhiều nhất tháng này
        const topBooksRaw = await BorrowRecord.aggregate([
            { $match: { borrowDate: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: '$book', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'bookInfo' } }
        ]);
        console.log(`[BACKEND] Top books found: ${topBooksRaw.length}`);

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
        console.log(`[BACKEND] Daily borrows/returns rows: ${dailyBorrowsRaw.length} / ${dailyReturnsRaw.length}`);

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
        console.log(`[BACKEND] Category stats found: ${categoryStatsRaw.length}`);

        const categoryDistribution = categoryStatsRaw.map(c => ({ category: c._id || 'Khác', count: c.count }));

        // 4. Summary
        const [totalThisMonth, returnedThisMonth, overdueCount] = await Promise.all([
            BorrowRecord.countDocuments({ borrowDate: { $gte: startOfMonth } }),
            BorrowRecord.countDocuments({ returnDate: { $gte: startOfMonth }, status: 'returned' }),
            BorrowRecord.countDocuments({ status: 'overdue' })
        ]);

        res.json({
            topBooks: topBooks || [],
            dailyBorrows: dailyBorrows || [],
            categoryDistribution: categoryDistribution || [],
            summary: { totalThisMonth, returnedThisMonth, overdueCount }
        });
    } catch (err) {
        console.error('[BACKEND] Error in getBorrowStats:', err);
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
    getBorrowStats: exports.getBorrowStats,
    renewBook: exports.renewBook
};
