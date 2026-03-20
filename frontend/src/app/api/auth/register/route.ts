import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { username, password, fullName, email, studentId, phone } = await req.json();

        if (!username || !password || !fullName) {
            return NextResponse.json({ message: 'Vui lòng nhập đầy đủ thông tin bắt buộc!' }, { status: 400 });
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return NextResponse.json({ message: 'Tên đăng nhập đã tồn tại!' }, { status: 400 });
        }

        const user = await User.create({
            username,
            password,
            fullName,
            email,
            studentId,
            phone,
            role: 'reader'
        });

        const token = generateToken(user._id.toString(), user.role);

        const userData = {
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
        };

        return NextResponse.json({ token, user: userData }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
