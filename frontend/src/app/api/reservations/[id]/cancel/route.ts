import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Reservation from '@/models/Reservation';
import { verifyToken, adminOnly } from '@/lib/auth';
import { sendReservationCancelledEmail } from '@/lib/email';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const requester = await verifyToken(req);
        if (!requester) return NextResponse.json({ message: 'Không có quyền!' }, { status: 401 });

        await connectDB();
        const { reason } = await req.json();
        const reservation = await Reservation.findById(id)
            .populate('user', 'fullName email')
            .populate('book', 'title');

        if (!reservation) return NextResponse.json({ message: 'Không tìm thấy đặt trước' }, { status: 404 });

        const isAdmin = adminOnly(requester);
        if (!isAdmin && reservation.user._id.toString() !== requester._id.toString()) {
            return NextResponse.json({ message: 'Không có quyền' }, { status: 403 });
        }
        if (!isAdmin && reservation.status !== 'pending') {
            return NextResponse.json({ message: 'Chỉ có thể hủy khi đặt trước đang chờ xử lý' }, { status: 400 });
        }

        reservation.status = 'cancelled';
        reservation.cancelledAt = new Date();
        reservation.cancelReason = reason || '';
        reservation.processedBy = requester._id;
        await reservation.save();

        const resUser = reservation.user as any;
        if (isAdmin && resUser?.email) {
            await sendReservationCancelledEmail({
                toEmail: resUser.email,
                borrowerName: (reservation.user as any).fullName,
                bookTitle: (reservation.book as any).title,
                reason,
            });
        }

        return NextResponse.json({ success: true, message: 'Đã hủy đặt trước' });
    } catch (error: any) {
        return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
    }
}
