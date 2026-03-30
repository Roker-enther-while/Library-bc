const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    username: String,
    action: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['info', 'warn', 'danger'],
        default: 'info'
    },
    ip: String,
    userAgent: String,
    path: String,
    method: String,
    payload: mongoose.Schema.Types.Mixed,
    reason: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SecurityLog', securityLogSchema);
