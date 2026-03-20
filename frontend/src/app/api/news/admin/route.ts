import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import News from '@/models/News';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });

        await connectDB();
        const news = await News.find().sort({ createdAt: -1 });
        return NextResponse.json(news);
    } catch (error: any) {
        return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
    }
}
