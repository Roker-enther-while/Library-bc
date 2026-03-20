import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import User from '@/models/User';
import { transformBook } from '@/lib/bookUtils';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) {
            return NextResponse.json({ message: 'Bạn không có quyền thực hiện hành động này!' }, { status: 403 });
        }

        await connectDB();
        const [totalBooks, totalUsers, authorsList] = await Promise.all([
            Book.countDocuments(),
            User.countDocuments(),
            Book.distinct('authorName')
        ]);

        const totalAuthors = authorsList.filter(Boolean).length;
        const books = await Book.find({});
        const totalViews = books.reduce((acc, b) => acc + (b.views || 0), 0);

        const topBooks = [...books]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5)
            .map(transformBook);

        return NextResponse.json({
            stats: {
                totalBooks,
                totalUsers,
                totalAuthors,
                totalViews
            },
            topBooks
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
