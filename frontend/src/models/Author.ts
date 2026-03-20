import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuthor extends Document {
    id: string;
    name: string;
    birthYear: number;
    deathYear: number;
    bio: string;
    era: string;
    avatar: string;
    region: string;
    createdAt: Date;
    updatedAt: Date;
}

const authorSchema = new Schema<IAuthor>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    birthYear: Number,
    deathYear: Number,
    bio: String,
    era: String,
    avatar: String,
    region: String
}, { timestamps: true });

const Author: Model<IAuthor> = mongoose.models.Author || mongoose.model<IAuthor>('Author', authorSchema);
export default Author;
