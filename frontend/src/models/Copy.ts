import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICopy extends Document {
    book: string;
    barcode: string;
    shelfLocation: string;
    status: 'available' | 'borrowed' | 'maintenance' | 'lost';
    condition: 'new' | 'good' | 'damaged' | 'worn';
    createdAt: Date;
    updatedAt: Date;
}

const copySchema = new Schema<ICopy>({
    book: {
        type: String,
        ref: 'Book',
        required: true
    },
    barcode: {
        type: String,
        required: true,
        unique: true
    },
    shelfLocation: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['available', 'borrowed', 'maintenance', 'lost'],
        default: 'available'
    },
    condition: {
        type: String,
        enum: ['new', 'good', 'damaged', 'worn'],
        default: 'new'
    }
}, { timestamps: true });

const Copy: Model<ICopy> = mongoose.models.Copy || mongoose.model<ICopy>('Copy', copySchema);
export default Copy;
