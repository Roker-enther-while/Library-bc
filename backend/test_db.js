const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./src/models/Book');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/library');
        console.log('Connected to DB');
        const books = await Book.find({});
        console.log('Books count:', books.length);
        if (books.length > 0) {
            console.log('First book title:', books[0].title);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
