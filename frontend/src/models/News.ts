import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INews extends Document {
    title: string;
    slug: string;
    content: string;
    thumbnail?: string;
    status: 'published' | 'draft';
    createdAt: Date;
    updatedAt: Date;
}

const newsSchema = new Schema<INews>({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    thumbnail: { type: String },
    status: { type: String, enum: ['published', 'draft'], default: 'draft' }
}, { timestamps: true });

const News: Model<INews> = mongoose.models.News || mongoose.model<INews>('News', newsSchema);
export default News;
