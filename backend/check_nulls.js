const mongoose = require('mongoose');
require('dotenv').config();
const Book = require('./src/models/Book');

async function checkNullFields() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const nullCat = await Book.countDocuments({ category: null });
        const missingCat = await Book.countDocuments({ category: { $exists: false } });
        console.log('Books with null category:', nullCat);
        console.log('Books with missing category:', missingCat);

        if (nullCat > 0 || missingCat > 0) {
            console.log('Fixing null/missing categories...');
            await Book.updateMany({ $or: [{ category: null }, { category: { $exists: false } }] }, { category: 'van-hoc' });
            console.log('Fixed.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkNullFields();
