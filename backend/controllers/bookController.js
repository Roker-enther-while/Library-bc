const Book = require('../models/Book');
const User = require('../models/User');
const Copy = require('../models/Copy');

// Transform MongoDB doc to frontend-compatible object
const transformBook = (book) => {
    if (!book) return null;
    const obj = book.toObject ? book.toObject() : book;
    return {
        ...obj,
        id: obj._id,
        year: obj.publicationYear || obj.year,
        coverUrl: obj.coverImage,
        totalCopies: obj.quantity,
        availableCopies: obj.available
    };
};

// Get all books
const getBooks = async (req, res) => {
    try {
        const books = await Book.find({});
        res.json(books.map(transformBook));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get book by ID
const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (book) {
            // Increment views automatically
            book.views = (book.views || 0) + 1;
            await book.save();
            res.json(transformBook(book));
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add book
const addBook = async (req, res) => {
    try {
        const { quantity, shelfLocation, ...rest } = req.body;
        const book = new Book({
            ...rest,
            _id: rest.id || rest._id || rest.title.toLowerCase().replace(/ /g, '-'),
            publicationYear: rest.year || rest.publicationYear,
            coverImage: rest.coverUrl || rest.coverImage,
            quantity: quantity || 1,
            available: quantity || 1,
            shelfLocation: shelfLocation || ''
        });
        const created = await book.save();

        // Automatically create copies for tracking
        const copies = [];
        for (let i = 0; i < (totalCopies || 1); i++) {
            copies.push({
                book: created._id,
                barcode: `B${created._id.toString().slice(-4)}${Date.now().toString().slice(-4)}${i}`,
                shelfLocation: shelfLocation || '',
                status: 'available'
            });
        }
        await Copy.insertMany(copies);

        res.status(201).json(transformBook(created));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update book
const updateBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        if (book) {
            res.json(transformBook(book));
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete book
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (book) {
            res.json({ message: 'Book removed' });
        } else {
            res.status(404).json({ message: 'Book not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search books using MongoDB Full-Text Search
const searchBooks = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            const books = await Book.find({});
            return res.json(books.map(transformBook));
        }

        const books = await Book.find(
            { $text: { $search: q } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } });

        res.json(books.map(transformBook));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Admin Stats
const getAdminStats = async (req, res) => {
    try {
        const [totalBooks, totalUsers, authorsList] = await Promise.all([
            Book.countDocuments(),
            User.countDocuments(),
            Book.distinct('authorName')
        ]);

        const totalAuthors = authorsList.filter(Boolean).length;

        const books = await Book.find({});
        const totalViews = books.reduce((acc, b) => acc + (b.views || 0), 0);

        // Get top 5 viewed books
        const topBooks = [...books]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5)
            .map(transformBook);

        res.json({
            stats: {
                totalBooks,
                totalUsers,
                totalAuthors,
                totalViews
            },
            topBooks
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getBooks, getBookById, addBook, updateBook, deleteBook, searchBooks, getAdminStats };
