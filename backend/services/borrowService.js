const User = require('../models/User');
const Copy = require('../models/Copy');
const mongoose = require('mongoose');

/**
 * BorrowService handles the complex logic for library circulation.
 */
class BorrowService {
    constructor(bookRepo, borrowRepo) {
        this.bookRepo = bookRepo;
        this.borrowRepo = borrowRepo;
    }
    /**
     * Creates an automated borrow record with transaction-like safety.
     */
    async createBorrow(userId, bookId, days, librarianId = null) {
        // 1. Validation Logic
        const user = await User.findById(userId);
        if (!user) throw new Error('Không tìm thấy độc giả!');
        if (user.cardStatus === 'locked') throw new Error('Thẻ độc giả đang bị khóa!');

        // 1.1 Check Borrow Limit
        const activeBorrows = await this.borrowRepo.findAll({ user: userId, status: { $in: ['borrowing', 'overdue'] } });
        if (activeBorrows.length >= (user.maxBorrowLimit || 5)) {
            throw new Error(`Độc giả đã đạt tới giới hạn mượn cho phép (${user.maxBorrowLimit || 5} cuốn)!`);
        }

        const book = await this.bookRepo.findById(bookId);
        if (!book) throw new Error('Không tìm thấy sách!');
        if (!book.isAvailable()) throw new Error('Sách hiện đã hết trong kho!');

        // 2. Business Logic Execution
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (days || 14));

        const record = await this.borrowRepo.create({
            user: userId,
            book: bookId,
            librarianId: librarianId,
            dueDate,
            status: 'borrowing'
        });

        // Use rich domain method
        await book.decrementAvailable();

        // Update copy status
        const copy = await Copy.findOne({ book: bookId, status: 'available' });
        if (copy) {
            copy.status = 'borrowed';
            await copy.save();
        }

        return record;
    }

    /**
     * Processes book return, calculating fines and updating stock.
     */
    async returnBook(recordId) {
        const record = await this.borrowRepo.findById(recordId);
        if (!record || record.status === 'returned') {
            throw new Error('Phiếu mượn không hợp lệ hoặc đã trả!');
        }

        // Use rich domain method for status and fine calculation
        await record.markAsReturned();

        // Update book stock
        const book = await this.bookRepo.findById(record.book);
        if (book) {
            await book.incrementAvailable();
        }

        // Update copy status
        const copy = await Copy.findOne({ book: record.book, status: 'borrowed' });
        if (copy) {
            copy.status = 'available';
            await copy.save();
        }

        return record;
    }

    async getUserHistory(userId) {
        return this.borrowRepo.findByUser(userId);
    }

    async getAllBorrows() {
        return this.borrowRepo.findAll();
    }

    async renewBook(recordId, days = 7) {
        const record = await this.borrowRepo.findById(recordId);
        if (!record) throw new Error('Không tìm thấy phiếu mượn!');
        return record.renew(days);
    }
}

module.exports = BorrowService;
