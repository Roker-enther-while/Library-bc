const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./src/models/Book');

async function checkFeatured() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const featuredCount = await Book.countDocuments({ isFeatured: true });
        console.log('Featured books count:', featuredCount);
        if (featuredCount === 0) {
            console.log('No featured books found. Setting some random books as featured...');
            const books = await Book.find({}).limit(10);
            for (const book of books) {
                book.isFeatured = true;
                await book.save();
            }
            console.log('Set 10 books as featured.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkFeatured();
