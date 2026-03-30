const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');
const Author = require('../models/Author');
const Category = require('../models/Category');
const Copy = require('../models/Copy');

const DATA_PATH = path.join(__dirname, 'vanhoc_data.json');
const MONGO_URI = 'mongodb+srv://huuphong:nhom1thuvien@cluster0.indiagt.mongodb.net/Library?appName=Cluster0';

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

const generateBarcode = (bookId) => {
    return `${bookId.substring(0, 4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
};

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const rawData = fs.readFileSync(DATA_PATH, 'utf8');
        const works = JSON.parse(rawData);

        for (const work of works) {
            const authorSlug = slugify(work.author);
            const categorySlug = slugify(work.category);
            const bookId = slugify(work.title);

            // 1. Author
            let author = await Author.findOne({ id: authorSlug });
            if (!author) {
                author = await Author.create({
                    id: authorSlug,
                    name: work.author,
                    era: work.period
                });
            }

            // 2. Category
            let category = await Category.findOne({ id: categorySlug });
            if (!category) {
                category = await Category.create({
                    id: categorySlug,
                    name: work.category
                });
            }

            // 3. Book
            let book = await Book.findById(bookId);
            if (!book) {
                book = await Book.create({
                    _id: bookId,
                    title: work.title,
                    authorId: authorSlug,
                    authorName: work.author,
                    category: categorySlug,
                    categoryName: work.category,
                    publicationYear: parseInt(work.period.replace(/\D/g, '')) || 2024,
                    summary: work.note,
                    significance: work.note,
                    quantity: 5,
                    available: 5,
                    coverColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                    coverImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(work.title)}&background=random&size=200`
                });
                console.log(`Created book: ${work.title}`);

                // 4. Create 5 copies for each book
                for (let i = 0; i < 5; i++) {
                    await Copy.create({
                        book: bookId,
                        barcode: generateBarcode(bookId) + i,
                        status: 'available',
                        condition: 'new',
                        shelfLocation: `Kệ ${categorySlug.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 10) + 1}`
                    });
                }
            } else {
                console.log(`Book already exists: ${work.title}`);
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seed();
