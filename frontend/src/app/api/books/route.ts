import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (query) {
            // Search logic (full-text index)
            const books = await Book.find(
                { $text: { $search: query } },
                { score: { $meta: 'textScore' } }
            ).sort({ score: { $meta: 'textScore' } });
            return NextResponse.json(books);
        }

        // Default: get all books
        const books = await Book.find({}).sort({ createdAt: -1 });
        return NextResponse.json(books);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) {
            return NextResponse.json({ message: 'Bạn không có quyền thực hiện hành động này!' }, { status: 403 });
        }

        await connectDB();
        const data = await req.json();

        // Check if _id already exists
        const existing = await Book.findById(data._id);
        if (existing) {
            return NextResponse.json({ message: 'Mã sách đã tồn tại!' }, { status: 400 });
        }

        const book = await Book.create(data);
        return NextResponse.json(book, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
