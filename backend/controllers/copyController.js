const Copy = require('../models/Copy');
const Book = require('../models/Book');

exports.getCopiesByBook = async (req, res) => {
    try {
        const copies = await Copy.find({ book: req.params.bookId });
        res.json(copies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addCopy = async (req, res) => {
    try {
        const { bookId, barcode, shelfLocation, condition } = req.body;

        // 1. Create copy
        const copy = await Copy.create({
            book: bookId,
            barcode,
            shelfLocation,
            condition
        });

        // 2. Sync Book quantities
        const book = await Book.findById(bookId);
        if (book) {
            book.quantity += 1;
            book.available += 1;
            await book.save();
        }

        res.status(201).json(copy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCopy = async (req, res) => {
    try {
        const copy = await Copy.findById(req.params.id);
        if (!copy) return res.status(404).json({ message: 'Không tìm thấy bản sao!' });

        const bookId = copy.book;
        await copy.deleteOne();

        // Sync Book quantities
        const book = await Book.findById(bookId);
        if (book) {
            book.quantity = Math.max(0, book.quantity - 1);
            book.available = Math.max(0, book.available - 1);
            await book.save();
        }

        res.json({ message: 'Đã xóa bản sao thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCopy = async (req, res) => {
    try {
        const copy = await Copy.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(copy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCopyByBarcode = async (req, res) => {
    try {
        const copy = await Copy.findOne({ barcode: req.params.barcode }).populate('book');
        if (!copy) return res.status(404).json({ message: 'Không tìm thấy mã vạch này!' });
        res.json(copy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
