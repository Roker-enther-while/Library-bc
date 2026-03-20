import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function verifyToken(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) return null;

    try {
        await connectDB();
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role: string };
        const user = await User.findById(decoded.id).select('-password');
        return user;
    } catch {
        return null;
    }
}

export function adminOnly(user: any) {
    return user && (user.role === 'admin' || user.role === 'librarian');
}

export function generateToken(id: string, role: string) {
    const expiresIn = (role === 'admin' || role === 'librarian') ? '4h' : '1d';
    return jwt.sign({ id, role }, JWT_SECRET, { expiresIn });
}
