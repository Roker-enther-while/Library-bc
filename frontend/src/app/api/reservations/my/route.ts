import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Reservation from '@/models/Reservation';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!requester) return NextResponse.json({ message: 'Không có quyền!' }, { status: 401 });

        await connectDB();
        const reservations = await Reservation.find({ user: requester._id })
            .populate('book', 'title authorName coverImage shelfLocation available')
            .sort({ createdAt: -1 });

        return NextResponse.json(reservations);
    } catch (error: any) {
        return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
    }
}
