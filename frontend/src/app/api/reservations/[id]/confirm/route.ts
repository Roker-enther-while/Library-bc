import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Reservation from '@/models/Reservation';
import { verifyToken, adminOnly } from '@/lib/auth';
import { sendReservationConfirmationEmail } from '@/lib/email';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const requester = await verifyToken(req);
        if (!requester || !adminOnly(requester)) return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });

        await connectDB();
        const { pickupDays = 3 } = await req.json();
        const reservation = await Reservation.findById(id)
            .populate('user', 'fullName email')
            .populate('book', 'title authorName coverImage');

        if (!reservation) return NextResponse.json({ message: 'Không tìm thấy đặt trước' }, { status: 404 });
        if (reservation.status !== 'pending') return NextResponse.json({ message: 'Chỉ có thể xác nhận yêu cầu đang chờ' }, { status: 400 });

        const pickupDeadline = new Date();
        pickupDeadline.setDate(pickupDeadline.getDate() + pickupDays);

        reservation.status = 'confirmed';
        reservation.confirmedAt = new Date();
        reservation.pickupDeadline = pickupDeadline;
        reservation.processedBy = (requester as any)._id;
        await reservation.save();

        const resUser = reservation.user as any;
        if (resUser?.email) {
            await sendReservationConfirmationEmail({
                toEmail: resUser.email,
                borrowerName: resUser.fullName,
                bookTitle: (reservation.book as any).title,
                bookAuthor: (reservation.book as any).authorName,
                coverImage: (reservation.book as any).coverImage,
                pickupDeadline,
            });
        }

        return NextResponse.json({ success: true, reservation });
    } catch (error: any) {
        return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
    }
}
