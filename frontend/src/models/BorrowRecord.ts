import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBorrowRecord extends Document {
    user: mongoose.Types.ObjectId;
    book: string;
    librarianId?: mongoose.Types.ObjectId;
    borrowDate: Date;
    dueDate: Date;
    returnDate?: Date;
    status: 'borrowed' | 'borrowing' | 'returned' | 'overdue' | 'lost';
    fineAmount: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const borrowRecordSchema = new Schema<IBorrowRecord>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: String,
        ref: 'Book',
        required: true
    },
    librarianId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    borrowDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['borrowed', 'borrowing', 'returned', 'overdue', 'lost'],
        default: 'borrowed'
    },
    fineAmount: {
        type: Number,
        default: 0
    },
    notes: String
}, { timestamps: true, collection: 'borrows' });

const BorrowRecord: Model<IBorrowRecord> = mongoose.models.BorrowRecord || mongoose.model<IBorrowRecord>('BorrowRecord', borrowRecordSchema);
export default BorrowRecord;
