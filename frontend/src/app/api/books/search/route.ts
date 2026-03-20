import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import { transformBook } from '@/lib/bookUtils';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        if (!q) {
            const books = await Book.find({}).sort({ createdAt: -1 });
            return NextResponse.json(books.map(transformBook));
        }

        const books = await Book.find(
            { $text: { $search: q } },
            { score: { $meta: 'textScore' } }
        ).sort({ score: { $meta: 'textScore' } });

        return NextResponse.json(books.map(transformBook));
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
