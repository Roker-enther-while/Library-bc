const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    birthYear: Number,
    deathYear: Number,
    bio: String,
    era: String,
    avatar: String,
    region: String
}, { timestamps: true });

module.exports = mongoose.model('Author', authorSchema);
