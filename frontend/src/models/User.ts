import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone: string;
    studentId: string;
    cardStatus: 'active' | 'locked';
    role: 'admin' | 'librarian' | 'reader';
    status: 'active' | 'inactive';
    penalties: number;
    matchPassword: (enteredPassword: string) => Promise<boolean>;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    studentId: { type: String, default: '' },
    cardStatus: { type: String, enum: ['active', 'locked'], default: 'active' },
    role: { type: String, enum: ['admin', 'librarian', 'reader'], default: 'reader' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    penalties: { type: Number, default: 0 },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next: any) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
