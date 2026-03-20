import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import { transformBook } from '@/lib/bookUtils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        const book = await Book.findById(id);
        if (!book) {
            return NextResponse.json({ message: 'Không tìm thấy sách!' }, { status: 404 });
        }

        // Increment views
        book.views = (book.views || 0) + 1;
        await book.save();

        return NextResponse.json(transformBook(book));
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        const data = await req.json();
        const book = await Book.findByIdAndUpdate(id, data, { new: true });

        if (!book) {
            return NextResponse.json({ message: 'Không tìm thấy sách!' }, { status: 404 });
        }

        return NextResponse.json(transformBook(book));
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        const book = await Book.findByIdAndDelete(id);
        if (!book) {
            return NextResponse.json({ message: 'Không tìm thấy sách!' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Đã xóa sách!' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
