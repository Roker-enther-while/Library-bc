const mongoose = require('mongoose');

const readingProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookId: {
        type: String,
        required: true
    },
    chapter: {
        type: Number,
        default: 1
    },
    chapterNumber: {
        type: Number,
        default: 1
    },
    scrollY: {
        type: Number,
        default: 0
    },
    lastRead: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Mỗi người dùng chỉ có 1 bản ghi tiến độ cho mỗi cuốn sách
readingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('ReadingProgress', readingProgressSchema);
