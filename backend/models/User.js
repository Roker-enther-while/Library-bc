const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String },
    fullName: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    studentId: { type: String, default: '' },
    cardStatus: { type: String, enum: ['active', 'locked'], default: 'active' },
    role: { type: String, enum: ['admin', 'librarian', 'reader'], default: 'reader' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    penalties: { type: Number, default: 0 },
    favorites: [{ type: String }],
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
