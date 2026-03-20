import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Author from '@/models/Author';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function GET() {
    try {
        await connectDB();
        const authors = await Author.find({});
        return NextResponse.json(authors);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) {
            return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });
        }

        await connectDB();
        const data = await req.json();
        const author = await Author.create(data);
        return NextResponse.json(author, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
}
