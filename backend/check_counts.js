const mongoose = require('mongoose');
require('dotenv').config();
const Author = require('./src/models/Author');
const Category = require('./src/models/Category');

async function checkCounts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const authorCount = await Author.countDocuments({});
        const categoryCount = await Category.countDocuments({});
        console.log('Author count:', authorCount);
        console.log('Category count:', categoryCount);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCounts();
