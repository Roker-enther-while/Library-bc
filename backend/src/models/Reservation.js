const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: {
        type: String,
        ref: 'Book',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'picked_up', 'expired'],
        default: 'pending'
    },
    note: { type: String, default: '' },
    requestDate: { type: Date, default: Date.now },
    pickupDeadline: { type: Date }, // set when confirmed
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // librarian
}, { timestamps: true });

module.exports = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);
