import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BorrowRecord from '@/models/BorrowRecord';
import { verifyToken } from '@/lib/auth';
import { askAI } from '@/lib/aiService';

export async function POST(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        const { messages, model } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ message: 'Messages array is required' }, { status: 400 });
        }

        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.content && lastMessage.content.length > 500) {
            return NextResponse.json({ message: 'Tin nhắn quá dài (tối đa 500 ký tự).' }, { status: 400 });
        }

        await connectDB();

        const context = {
            userName: requester?.fullName || 'Khách',
            userId: requester?._id,
            cardStatus: requester?.cardStatus || 'active',
            currentBorrowsCount: 0
        };

        if (context.userId) {
            context.currentBorrowsCount = await BorrowRecord.countDocuments({
                user: context.userId,
                status: 'borrowing'
            });
        }

        const response = await askAI(messages, context, model);
        return NextResponse.json({ response });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
