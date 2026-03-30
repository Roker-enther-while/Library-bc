const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'alert', 'success'],
        default: 'info'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedId: String, // Can link to a BorrowRecord or Book
    relatedType: String
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
