const BorrowRecord = require('../models/BorrowRecord');

class BorrowRepository {
    async create(data) {
        return BorrowRecord.create(data);
    }

    async findById(id) {
        return BorrowRecord.findById(id);
    }

    async findByUser(userId) {
        return BorrowRecord.find({ user: userId })
            .populate('book', 'title coverImage author category')
            .sort({ createdAt: -1 });
    }

    async findAll() {
        return BorrowRecord.find({})
            .populate('user', 'fullName studentId phone penalties')
            .populate('book', 'title author category')
            .sort({ borrowDate: -1 });
    }
}

module.exports = new BorrowRepository();
