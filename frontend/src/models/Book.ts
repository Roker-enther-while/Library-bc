import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBook extends Document {
    _id: any; // Use any to satisfy Document and custom string IDs
    title: string;
    authorId: string;
    authorName: string;
    category: string;
    categoryName: string;
    publicationYear: number;
    isbn: string;
    publisher: string;
    quantity: number;
    available: number;
    shelfLocation: string;
    borrowCount: number;
    coverColor: string;
    coverImage: string;
    readTime: number;
    views: number;
    isFeatured: boolean;
    summary: string;
    significance: string;
    excerpt: string;
    fullText: string;
    createdAt: Date;
    updatedAt: Date;
}

const bookSchema = new Schema<IBook>({
    _id: { type: String, required: true },
    title: { type: String, required: true },
    authorId: String,
    authorName: String,
    category: String,
    categoryName: String,
    publicationYear: Number,
    isbn: { type: String, default: '' },
    publisher: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    available: { type: Number, default: 1 },
    shelfLocation: { type: String, default: '' },
    borrowCount: { type: Number, default: 0 },
    coverColor: String,
    coverImage: String,
    readTime: Number,
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    summary: String,
    significance: String,
    excerpt: String,
    fullText: String
}, { timestamps: true, _id: false }); // Disable auto _id since we provide our own string ID

// Full-Text Search Index
bookSchema.index({
    title: 'text',
    authorName: 'text',
    summary: 'text'
});

const Book: Model<IBook> = mongoose.models.Book || mongoose.model<IBook>('Book', bookSchema);
export default Book;
