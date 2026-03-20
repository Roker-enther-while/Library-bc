import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BorrowRecord from '@/models/BorrowRecord';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const history = await BorrowRecord.find({ user: params.id })
            .populate('book', 'title coverImage authorName category')
            .sort({ createdAt: -1 });
        return NextResponse.json(history);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
