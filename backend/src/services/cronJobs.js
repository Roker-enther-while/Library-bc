const cron = require('node-cron');
const BorrowRecord = require('../models/BorrowRecord');
const { sendDueReminderEmail } = require('./emailService');

/**
 * Tìm và gửi email nhắc nhở cho tất cả phiếu mượn sắp hết hạn / quá hạn
 * @returns {Object} kết quả { sent, failed, skipped }
 */
const sendDueReminders = async () => {
    console.log('📧 [CronJob] Đang kiểm tra phiếu mượn sắp hết hạn...');

    const now = new Date();
    // Tìm phiếu borrowed: hết hạn trong 3 ngày tới HOẶC đã quá hạn nhưng chưa trả
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    try {
        const records = await BorrowRecord.find({
            status: { $in: ['borrowed', 'overdue'] },
            dueDate: { $lte: threeDaysFromNow },
        }).populate('user', 'fullName email').populate('book', 'title');

        if (!records.length) {
            console.log('✅ [CronJob] Không có phiếu mượn nào cần nhắc nhở.');
            return { sent: 0, failed: 0, skipped: 0 };
        }

        let sent = 0, failed = 0, skipped = 0;

        for (const record of records) {
            const email = record.user?.email;
            const name = record.user?.fullName || 'Bạn đọc';
            const title = record.book?.title || record.bookTitle || 'Không rõ';
            const dueDate = record.dueDate;

            if (!email) { skipped++; continue; }

            const daysLeft = Math.ceil((new Date(dueDate) - now) / (1000 * 60 * 60 * 24));

            const ok = await sendDueReminderEmail({
                toEmail: email,
                borrowerName: name,
                bookTitle: title,
                dueDate,
                daysLeft,
            });

            ok ? sent++ : failed++;
        }

        console.log(`📧 [CronJob] Xong: ${sent} gửi thành công, ${failed} thất bại, ${skipped} bỏ qua (không có email).`);
        return { sent, failed, skipped };
    } catch (err) {
        console.error('❌ [CronJob] Lỗi khi chạy sendDueReminders:', err.message);
        return { sent: 0, failed: 0, skipped: 0 };
    }
};

/**
 * Khởi động các cron jobs.
 * Gọi hàm này trong server.js sau khi server lắng nghe.
 */
const startCronJobs = () => {
    // Chạy lúc 8:00 sáng mỗi ngày (giờ Việt Nam UTC+7)
    cron.schedule('0 1 * * *', async () => {
        // 01:00 UTC = 08:00 Việt Nam
        console.log('⏰ [CronJob] Chạy nhắc hạn mượn sách - ' + new Date().toLocaleString('vi-VN'));
        await sendDueReminders();
    }, { timezone: 'UTC' });

    console.log('✅ Cron jobs đã được khởi động (nhắc hạn mượn sách mỗi ngày 8h sáng).');
};

module.exports = { startCronJobs, sendDueReminders };
