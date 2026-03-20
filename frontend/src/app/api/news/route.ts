import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import News from '@/models/News';

export async function GET() {
    try {
        await connectDB();
        const news = await News.find({ status: 'published' }).sort({ createdAt: -1 });
        return NextResponse.json(news);
    } catch (error: any) {
        return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
    }
}
