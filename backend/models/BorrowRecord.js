const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: String,
        ref: 'Book',
        required: true
    },
    librarianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    borrowDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['borrowed', 'borrowing', 'returned', 'overdue', 'lost'],
        default: 'borrowed'
    },
    fineAmount: {
        type: Number,
        default: 0
    },
    notes: String
}, { timestamps: true, collection: 'borrows' });

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);
