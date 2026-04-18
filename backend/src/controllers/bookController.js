const Book = require('../models/Book');
const User = require('../models/User');
const Copy = require('../models/Copy');
const ReadingProgress = require('../models/ReadingProgress');

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
        const { id } = req.params;
        let book = await Book.findById(id);

        if (!book) {
            // Trường hợp dự phòng nếu search bằng slug nhưng _id không khớp
            book = await Book.findOne({ _id: id });
        }

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

// Get specific chapter
const getChapter = async (req, res) => {
    try {
        const { id, chapterNumber } = req.params;
        const num = parseInt(chapterNumber);

        const book = await Book.findById(id);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        // Hiện tại dữ liệu chưa chi tiết chương, trả về fullText cho chương 1
        if (num === 1) {
            res.json({
                bookId: book._id,
                chapterNumber: 1,
                title: 'Toàn văn',
                content: book.fullText || book.excerpt || 'Nội dung đang được cập nhật...'
            });
        } else {
            res.status(404).json({ message: 'Chapter not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Save reading progress
const saveReadingProgress = async (req, res) => {
    try {
        const { id } = req.params; // bookId (slug or _id)
        const { chapter, scrollY } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Không tìm thấy thông tin người dùng!' });
        }

        console.log(`[BACKEND] Saving progress for book: ${id}, user: ${userId}, scrollY: ${scrollY}`);

        try {
            const progress = await ReadingProgress.findOneAndUpdate(
                { userId: userId, bookId: id },
                {
                    chapter: chapter || 1,
                    chapterNumber: chapter || 1, // Sync with both names
                    scrollY: scrollY || 0,
                    lastRead: Date.now()
                },
                { upsert: true, new: true, runValidators: true }
            );

            res.json(progress);
        } catch (dbError) {
            // Handle race condition for upsert
            if (dbError.code === 11000) {
                const retryProgress = await ReadingProgress.findOneAndUpdate(
                    { userId: userId, bookId: id },
                    {
                        chapter: chapter || 1,
                        chapterNumber: chapter || 1,
                        scrollY: scrollY || 0,
                        lastRead: Date.now()
                    },
                    { new: true }
                );
                return res.json(retryProgress);
            }
            throw dbError; // re-throw to outer catch
        }
    } catch (error) {
        console.error('[DATABASE ERROR] saveReadingProgress failed:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get reading progress
const getReadingProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.json({ chapter: 1, scrollY: 0 });
        }

        console.log(`[BACKEND] Getting progress for book: ${id}, user: ${userId}`);
        const progress = await ReadingProgress.findOne({ userId: userId, bookId: id });
        res.json(progress || { chapter: 1, scrollY: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Slugify helper for Vietnamese & special characters
const slugify = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '') // Remove non-alphanumeric except dash/space
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/-+/g, '-') // Replace multiple -
        .replace(/^-+/, '') // Trim starting -
        .replace(/-+$/, ''); // Trim ending -
};

// Add book
const addBook = async (req, res) => {
    try {
        const { quantity, shelfLocation, ...rest } = req.body;
        if (!rest.title) return res.status(400).json({ message: 'Tiêu đề sách là bắt buộc' });

        const generatedId = rest.id || rest._id || slugify(rest.title);

        // Check if ID already exists
        const existing = await Book.findById(generatedId);
        if (existing) {
            return res.status(400).json({ message: `Sách với ID "${generatedId}" đã tồn tại. Vui lòng kiểm tra lại tiêu đề.` });
        }

        const book = new Book({
            ...rest,
            _id: generatedId,
            publicationYear: parseInt(rest.year) || rest.publicationYear,
            coverImage: rest.coverUrl || rest.coverImage,
            quantity: parseInt(quantity) || 1,
            available: parseInt(quantity) || 1,
            shelfLocation: shelfLocation || ''
        });
        const created = await book.save();

        // Automatically create copies for tracking
        const copies = [];
        for (let i = 0; i < (parseInt(quantity) || 1); i++) {
            copies.push({
                book: created._id,
                barcode: `B${created._id.toString().slice(-4)}${Date.now().toString().slice(-4)}${i}`,
                status: 'available'
            });
        }
        await Copy.insertMany(copies);

        res.status(201).json(transformBook(created));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update book
const updateBook = async (req, res) => {
    try {
        const { _id, id, ...updateData } = req.body; // Remove ID from body to prevent Mongo error

        // Ensure year, quantity, available are numbers if present
        if (updateData.year) updateData.publicationYear = parseInt(updateData.year);
        if (updateData.quantity) updateData.quantity = parseInt(updateData.quantity);
        if (updateData.available) updateData.available = parseInt(updateData.available);

        const book = await Book.findByIdAndUpdate(req.params.id, updateData, {
            runValidators: true,
            new: true
        });

        if (book) {
            res.json(transformBook(book));
        } else {
            res.status(404).json({ message: 'Không tìm thấy sách' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
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

module.exports = { getBooks, getBookById, getChapter, saveReadingProgress, getReadingProgress, addBook, updateBook, deleteBook, searchBooks, getAdminStats };
