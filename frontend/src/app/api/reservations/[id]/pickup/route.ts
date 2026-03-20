import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Reservation from '@/models/Reservation';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const requester = await verifyToken(req);
        if (!requester || !adminOnly(requester)) return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });

        await connectDB();
        const reservation = await Reservation.findByIdAndUpdate(
            id,
            { status: 'picked_up', processedBy: (requester as any)._id },
            { new: true }
        );
        if (!reservation) return NextResponse.json({ message: 'Không tìm thấy' }, { status: 404 });
        return NextResponse.json({ success: true, reservation });
    } catch (error: any) {
        return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
    }
}
