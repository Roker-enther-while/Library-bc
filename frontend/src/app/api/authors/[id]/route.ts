import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Author from '@/models/Author';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const author = await Author.findOne({ id: params.id });
        if (!author) return NextResponse.json({ message: 'Không tìm thấy tác giả!' }, { status: 404 });
        return NextResponse.json(author);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });

        await connectDB();
        const data = await req.json();
        const author = await Author.findOneAndUpdate({ id: params.id }, data, { new: true });
        return NextResponse.json(author);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });

        await connectDB();
        await Author.findOneAndDelete({ id: params.id });
        return NextResponse.json({ message: 'Đã xóa tác giả!' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
