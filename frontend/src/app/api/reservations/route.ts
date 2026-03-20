import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import Reservation from '@/models/Reservation';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!requester) return NextResponse.json({ message: 'Không có quyền!' }, { status: 401 });

        await connectDB();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const filter: any = {};
        if (status) filter.status = status;

        const reservations = await Reservation.find(filter)
            .populate('user', 'fullName email studentId')
            .populate('book', 'title authorName coverImage available')
            .sort({ createdAt: -1 });

        return NextResponse.json(reservations);
    } catch (error: any) {
        return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!requester) return NextResponse.json({ message: 'Không có quyền!' }, { status: 401 });

        await connectDB();
        const { bookId, note } = await req.json();

        const book = await Book.findById(bookId);
        if (!book) return NextResponse.json({ message: 'Không tìm thấy sách' }, { status: 404 });

        const existing = await Reservation.findOne({
            user: requester._id, book: bookId, status: { $in: ['pending', 'confirmed'] }
        });
        if (existing) return NextResponse.json({ message: 'Bạn đã có yêu cầu đặt trước sách này đang chờ xử lý' }, { status: 400 });

        const reservation = await Reservation.create({ user: requester._id, book: bookId, note });
        return NextResponse.json({ success: true, reservation }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
    }
}
