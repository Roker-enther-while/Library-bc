const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    thumbnail: { type: String },
    status: { type: String, enum: ['published', 'draft'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);
