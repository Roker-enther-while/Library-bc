const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Author = require('../backend/models/Author');
const Book = require('../backend/models/Book');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://huuphong:nhom1thuvien@cluster0.indiagt.mongodb.net/Library';

async function diagnose() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const authors = await Author.find({});
        console.log(`\n--- AUTHORS (${authors.length}) ---`);
        authors.forEach(a => {
            const missing = [];
            if (!a.bio) missing.push('bio');
            if (!a.era) missing.push('era');
            if (!a.region) missing.push('region');
            if (!a.avatar) missing.push('avatar');
            if (missing.length > 0) {
                console.log(`[Author] ${a.name} (${a.id}): Missing ${missing.join(', ')}`);
            }
        });

        const books = await Book.find({});
        console.log(`\n--- BOOKS (${books.length}) ---`);
        books.forEach(b => {
            const missing = [];
            if (!b.summary) missing.push('summary');
            if (!b.excerpt) missing.push('excerpt');
            if (!b.fullText) missing.push('fullText');
            if (!b.coverImage) missing.push('coverImage');
            if (!b.coverColor) missing.push('coverColor');
            if (missing.length > 0) {
                console.log(`[Book] ${b.title} (${b._id}): Missing ${missing.join(', ')}`);
            }
        });

        process.exit(0);
    } catch (error) {
        console.error('Diagnosis failed:', error);
        process.exit(1);
    }
}

diagnose();
