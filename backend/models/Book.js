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

// Đánh chỉ mục (Index) Full-Text Search cho các trường quan trọng
bookSchema.index({
    title: 'text',
    authorName: 'text',
    summary: 'text'
});

module.exports = mongoose.model('Book', bookSchema);
