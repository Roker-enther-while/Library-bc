import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BorrowRecord from '@/models/BorrowRecord';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) {
            return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });
        }

        await connectDB();
        const borrows = await BorrowRecord.find({})
            .populate('user', 'fullName studentId phone')
            .populate('book', 'title authorName category')
            .sort({ borrowDate: -1 });
        return NextResponse.json(borrows);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
