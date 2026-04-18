const mongoose = require('mongoose');

const copySchema = new mongoose.Schema({
    book: {
        type: String,
        ref: 'Book',
        required: true
    },
    barcode: {
        type: String,
        required: true,
        unique: true
    },
    shelfLocation: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['available', 'borrowed', 'maintenance', 'lost'],
        default: 'available'
    },
    condition: {
        type: String,
        enum: ['new', 'good', 'damaged', 'worn'],
        default: 'new'
    }
}, { timestamps: true });

module.exports = mongoose.model('Copy', copySchema);
