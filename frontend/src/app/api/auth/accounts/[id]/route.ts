import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) {
            return NextResponse.json({ message: 'Bạn không có quyền thực hiện hành động này!' }, { status: 403 });
        }

        await connectDB();
        const { password, ...rest } = await req.json();
        const user = await User.findById(params.id);
        if (!user) {
            return NextResponse.json({ message: 'Không tìm thấy tài khoản!' }, { status: 404 });
        }

        Object.assign(user, rest);
        if (password) user.password = password;
        await user.save();

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
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) {
            return NextResponse.json({ message: 'Bạn không có quyền thực hiện hành động này!' }, { status: 403 });
        }

        await connectDB();
        const user = await User.findByIdAndDelete(params.id);
        if (!user) {
            return NextResponse.json({ message: 'Không tìm thấy tài khoản!' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Đã xóa tài khoản!' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    // This is for toggleStatus
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) {
            return NextResponse.json({ message: 'Bạn không có quyền thực hiện hành động này!' }, { status: 403 });
        }

        await connectDB();
        const user = await User.findById(params.id);
        if (!user) {
            return NextResponse.json({ message: 'Không tìm thấy tài khoản!' }, { status: 404 });
        }

        user.status = user.status === 'active' ? 'inactive' : 'active';
        await user.save();

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
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
