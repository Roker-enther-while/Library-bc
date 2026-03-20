import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });

        await connectDB();
        const data = await req.json();
        const category = await Category.findOneAndUpdate({ id: params.id }, data, { new: true });
        return NextResponse.json(category);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });

        await connectDB();
        await Category.findOneAndDelete({ id: params.id });
        return NextResponse.json({ message: 'Đã xóa danh mục!' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
