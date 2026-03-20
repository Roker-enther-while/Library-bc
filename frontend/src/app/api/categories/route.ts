import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function GET() {
    try {
        await connectDB();
        const categories = await Category.find({});
        return NextResponse.json(categories);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });

        await connectDB();
        const data = await req.json();
        const category = await Category.create(data);
        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
