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
        enum: ['borrowing', 'returned', 'overdue', 'lost'],
        default: 'borrowing'
    },
    fineAmount: {
        type: Number,
        default: 0
    },
    renewCount: {
        type: Number,
        default: 0
    },
    notes: String
}, { timestamps: true, collection: 'borrows' });

const FINE_PER_DAY = 5000;

// Instance methods - Rich Domain Logic
borrowRecordSchema.methods.calculateFine = function () {
    // Nếu đã trả, dùng returnDate, nếu chưa trả, dùng thời điểm hiện tại để tính phạt "nóng"
    const endDate = this.returnDate || new Date();
    if (endDate > this.dueDate) {
        const diffTime = Math.max(0, endDate.getTime() - this.dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * FINE_PER_DAY;
    }
    return 0;
};

borrowRecordSchema.methods.markAsReturned = async function () {
    if (this.status === 'returned') return this;

    this.returnDate = new Date();
    this.fineAmount = this.calculateFine();
    this.status = 'returned';

    // Cập nhật phạt vào User profile (nếu có)
    if (this.fineAmount > 0) {
        const User = mongoose.model('User');
        const user = await User.findById(this.user);
        if (user) {
            user.penalties = (user.penalties || 0) + this.fineAmount;
            await user.save();
        }
    }

    return this.save();
};

borrowRecordSchema.methods.renew = function (days = 7) {
    if (this.status === 'returned') throw new Error('Không thể gia hạn sách đã trả!');
    if (this.renewCount >= 2) throw new Error('Sách này đã đạt giới hạn gia hạn (2 lần)!');

    // Gia hạn từ dueDate hiện tại
    const newDueDate = new Date(this.dueDate);
    newDueDate.setDate(newDueDate.getDate() + days);

    this.dueDate = newDueDate;
    this.renewCount += 1;
    this.status = 'borrowing'; // Trở lại trạng thái đang mượn nếu trước đó bị overdue

    return this.save();
};

// Middleware tự động cập nhật status overdue khi truy vấn
borrowRecordSchema.post('init', function (doc) {
    if (doc.status === 'borrowing' && doc.dueDate < new Date()) {
        doc.status = 'overdue';
    }
});

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);

