const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../scripts/cryptoHelper');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    studentId: { type: String, default: '' },
    cardStatus: { type: String, enum: ['active', 'locked'], default: 'active' },
    role: { type: String, enum: ['admin', 'librarian', 'reader'], default: 'reader' }
}, { timestamps: true });

// Pre-save hook to hash password AND encrypt sensitive data (studentId, phone)
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    
    // Encrypt sensitive fields
    if (this.isModified('studentId') && this.studentId) {
        this.studentId = encrypt(this.studentId);
    }
    if (this.isModified('phone') && this.phone) {
        this.phone = encrypt(this.phone);
    }
    next();
});

// Post-init hook to transparently decrypt sensitive fields for application use
userSchema.post('init', function (doc) {
    if (doc.studentId) doc.studentId = decrypt(doc.studentId);
    if (doc.phone) doc.phone = decrypt(doc.phone);
});

// Helper method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
