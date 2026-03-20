import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BorrowRecord from '@/models/BorrowRecord';
import Book from '@/models/Book';
import User from '@/models/User';
import { verifyToken, adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const requester = await verifyToken(req);
        if (!adminOnly(requester)) {
            return NextResponse.json({ message: 'Không có quyền!' }, { status: 403 });
        }

        await connectDB();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Top books aggregate
        const topBooksRaw = await BorrowRecord.aggregate([
            { $match: { borrowDate: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: '$book', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'bookInfo' } }
        ]);

        const topBooks = topBooksRaw.map(item => ({
            bookTitle: item.bookInfo[0]?.title || 'Không rõ',
            count: item.count
        }));

        // Daily borrows aggregate (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const [dailyBorrowsRaw, dailyReturnsRaw] = await Promise.all([
            BorrowRecord.aggregate([
                { $match: { borrowDate: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$borrowDate' } }, borrowed: { $sum: 1 } } }
            ]),
            BorrowRecord.aggregate([
                { $match: { returnDate: { $gte: thirtyDaysAgo }, status: 'returned' } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$returnDate' } }, returned: { $sum: 1 } } }
            ])
        ]);

        const dateMap: any = {};
        dailyBorrowsRaw.forEach(d => dateMap[d._id] = { borrowed: d.borrowed, returned: 0 });
        dailyReturnsRaw.forEach(d => {
            if (dateMap[d._id]) dateMap[d._id].returned = d.returned;
            else dateMap[d._id] = { borrowed: 0, returned: d.returned };
        });

        const dailyBorrows = Object.keys(dateMap).sort().map(d => ({
            date: new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            borrowed: dateMap[d].borrowed,
            returned: dateMap[d].returned
        }));

        // Summary
        const [totalThisMonth, returnedThisMonth, overdueCount] = await Promise.all([
            BorrowRecord.countDocuments({ borrowDate: { $gte: startOfMonth } }),
            BorrowRecord.countDocuments({ returnDate: { $gte: startOfMonth }, status: 'returned' }),
            BorrowRecord.countDocuments({ status: 'overdue' })
        ]);

        return NextResponse.json({
            topBooks,
            dailyBorrows,
            summary: { totalThisMonth, returnedThisMonth, overdueCount }
        });
    } catch (err: any) {
        return NextResponse.json({ message: 'Lỗi khi lấy thống kê' }, { status: 500 });
    }
}
