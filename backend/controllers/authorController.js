const Author = require('../models/Author');

const getAuthors = async (req, res) => {
    try {
        const authors = await Author.find({});
        res.json(authors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAuthorById = async (req, res) => {
    try {
        const author = await Author.findOne({ id: req.params.id });
        if (author) {
            res.json(author);
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
        const author = await Author.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(author);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteAuthor = async (req, res) => {
    try {
        await Author.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Author deleted' });
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
