import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BorrowRecord from '@/models/BorrowRecord';
import Book from '@/models/Book';
import User from '@/models/User';
import Copy from '@/models/Copy';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        // Assume librarian or admin can create borrow records
        if (!requester || !adminOnly(requester)) {
            return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });
        }

        await connectDB();
        const { userId, bookId, days } = await req.json();

        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ message: 'Không tìm thấy độc giả!' }, { status: 404 });
        if (user.cardStatus === 'locked') return NextResponse.json({ message: 'Thẻ độc giả đang bị khóa!' }, { status: 403 });

        const book = await Book.findById(bookId);
        if (!book || book.available <= 0) {
            return NextResponse.json({ message: 'Sách hiện đã hết trong kho!' }, { status: 400 });
        }

        const copy = await Copy.findOne({ book: bookId, status: 'available' });

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (days || 14));

        const record = await BorrowRecord.create({
            user: userId,
            book: bookId,
            librarianId: (requester as any)._id,
            dueDate,
            status: 'borrowing'
        });

        book.available -= 1;
        await book.save();

        if (copy) {
            copy.status = 'borrowed';
            await copy.save();
        }

        return NextResponse.json(record, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
