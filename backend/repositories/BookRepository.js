const Book = require('../models/Book');

class BookRepository {
    async findById(id) {
        return Book.findById(id);
    }

    async updateAvailable(id, amount) {
        const book = await Book.findById(id);
        if (book) {
            book.available += amount;
            return book.save();
        }
        return null;
    }
}

module.exports = new BookRepository();
