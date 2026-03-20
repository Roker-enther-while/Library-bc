import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ message: 'Vui lòng nhập đầy đủ thông tin!' }, { status: 400 });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return NextResponse.json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng!' }, { status: 401 });
        }

        if (user.status === 'inactive') {
            return NextResponse.json({ message: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin!' }, { status: 401 });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng!' }, { status: 401 });
        }

        const token = generateToken(user._id.toString(), user.role);

        // Transform user for response
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

        return NextResponse.json({ token, user: userData });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
