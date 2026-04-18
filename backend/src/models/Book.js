const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    title: { type: String, required: true },
    authorId: String,
    authorName: String,
    category: String,
    categoryName: String,
    publicationYear: Number,
    isbn: { type: String, default: '' },
    publisher: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    available: { type: Number, default: 1 },
    shelfLocation: { type: String, default: '' },
    borrowCount: { type: Number, default: 0 },
    coverColor: String,
    coverImage: String,
    readTime: Number,
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    summary: String,
    significance: String,
    excerpt: String,
    fullText: String
}, { timestamps: true });

// Pre-save hook để tự động tạo _id (slug) từ title nếu chưa có
// Sử dụng function thường để bind 'this'
bookSchema.pre('save', function () {
    if (!this._id || this.isNew) {
        // Slugify helper đơn giản trong Model (tương tự controller)
        const slugify = (text) => {
            if (!text) return '';
            return text.toString().toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/([^0-9a-z-\s])/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
        };
        const generatedId = slugify(this.title);
        if (!this._id) this._id = generatedId;
    }
});

// Instance methods - Rich Domain Logic
bookSchema.methods.isAvailable = function () {
    return this.available > 0;
};

bookSchema.methods.decrementAvailable = async function () {
    if (this.available <= 0) throw new Error('Sách hiện đã hết trong kho!');
    this.available -= 1;
    return this.save();
};

bookSchema.methods.incrementAvailable = async function () {
    if (this.available >= this.quantity) {
        this.available = this.quantity; // Cap at quantity
    } else {
        this.available += 1;
    }
    return this.save();
};


// Đánh chỉ mục (Index) Full-Text Search cho các trường quan trọng
bookSchema.index({
    title: 'text',
    authorName: 'text',
    summary: 'text'
});

module.exports = mongoose.model('Book', bookSchema);
