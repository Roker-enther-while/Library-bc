import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) {
            return NextResponse.json({ message: 'Bạn không có quyền thực hiện hành động này!' }, { status: 403 });
        }

        await connectDB();
        const users = await User.find({}).sort({ createdAt: -1 });

        const transformed = users.map(user => ({
            id: user._id.toString(),
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            studentId: user.studentId,
            cardStatus: user.cardStatus,
            penalties: user.penalties || 0,
            createdAt: user.createdAt,
        }));

        return NextResponse.json(transformed);
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
        const { username, password, fullName, email, phone, role } = await req.json();

        const existing = await User.findOne({ username });
        if (existing) {
            return NextResponse.json({ message: 'Tên đăng nhập đã tồn tại!' }, { status: 400 });
        }

        const user = await User.create({ username, password, fullName, email, phone, role });

        return NextResponse.json({
            id: user._id.toString(),
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            studentId: user.studentId,
            cardStatus: user.cardStatus,
            penalties: user.penalties || 0,
            createdAt: user.createdAt,
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
