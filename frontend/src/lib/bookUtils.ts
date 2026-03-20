import { IBook } from '@/models/Book';

export const transformBook = (book: any) => {
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
