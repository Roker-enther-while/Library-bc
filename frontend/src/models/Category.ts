import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
    id: string;
    name: string;
    description: string;
    icon: string;
    gradient: string;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    icon: String,
    gradient: String
}, { timestamps: true });

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
export default Category;
