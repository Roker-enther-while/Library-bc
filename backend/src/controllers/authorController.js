const Author = require('../models/Author');
const Book = require('../models/Book');

const getAuthors = async (req, res) => {
    try {
        const authors = await Author.find({});
        const books = await Book.find({}).select('authorId');

        const authorsWithCount = authors.map(author => {
            const count = books.filter(b =>
                b.authorId === author.id ||
                b.authorId === author._id.toString()
            ).length;

            return {
                ...author.toObject(),
                worksCount: count
            };
        });

        res.json(authorsWithCount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAuthorById = async (req, res) => {
    try {
        const { id } = req.params;
        let author;

        if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
            author = await Author.findById(id);
        }

        if (!author) {
            author = await Author.findOne({ id });
        }

        if (author) {
            // Tìm các tác phẩm của tác giả này
            // Tìm theo cả authorId (slug) và tác giả (nếu có liên kết ObjectId)
            const books = await Book.find({
                $or: [
                    { authorId: author.id },
                    { authorId: author._id.toString() }
                ]
            });

            console.log(`[Backend-Detail] Found ${books.length} books for author: ${author.name} (id: ${author.id}, _id: ${author._id})`);

            res.json({
                ...author.toObject(),
                books: books.map(b => {
                    const obj = b.toObject();
                    return {
                        ...obj,
                        id: obj._id,
                        year: obj.publicationYear || obj.year,
                        coverUrl: obj.coverImage,
                        totalCopies: obj.quantity,
                        availableCopies: obj.available
                    };
                })
            });
        } else {
            res.status(404).json({ message: 'Author not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addAuthor = async (req, res) => {
    try {
        const author = await Author.create(req.body);
        res.status(201).json(author);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        let author;

        if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
            author = await Author.findByIdAndUpdate(id, req.body, { new: true });
        }

        if (!author) {
            author = await Author.findOneAndUpdate({ id }, req.body, { new: true });
        }

        if (author) {
            res.json(author);
        } else {
            res.status(404).json({ message: 'Author not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        let result;

        if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
            result = await Author.findByIdAndDelete(id);
        }

        if (!result) {
            result = await Author.findOneAndDelete({ id });
        }

        if (result) {
            res.json({ message: 'Author deleted' });
        } else {
            res.status(404).json({ message: 'Author not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAuthors,
    getAuthorById,
    addAuthor,
    updateAuthor,
    deleteAuthor
};
