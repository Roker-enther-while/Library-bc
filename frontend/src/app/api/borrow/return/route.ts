import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BorrowRecord from '@/models/BorrowRecord';
import Book from '@/models/Book';
import Copy from '@/models/Copy';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) {
            return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });
        }

        await connectDB();
        const { recordId } = await req.json();
        const record = await BorrowRecord.findById(recordId);

        if (!record || record.status === 'returned') {
            return NextResponse.json({ message: 'Phiếu mượn không hợp lệ hoặc đã trả!' }, { status: 400 });
        }

        record.returnDate = new Date();
        record.status = 'returned';

        if (record.returnDate > record.dueDate) {
            const diffTime = Math.abs(record.returnDate.getTime() - record.dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            record.fineAmount = diffDays * 5000;
        }

        await record.save();

        const book = await Book.findById(record.book);
        if (book) {
            book.available += 1;
            await book.save();
        }

        const copy = await Copy.findOne({ book: record.book, status: 'borrowed' });
        if (copy) {
            copy.status = 'available';
            await copy.save();
        }

        return NextResponse.json(record);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
