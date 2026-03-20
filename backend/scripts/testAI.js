/**
 * testAI.js - Demo and Verification script for "Thư Đồng" AI Council
 * This script simulates a conversation and logs the AI's internal reasoning.
 */
const { processAIChat } = require('../ai/ai.service');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected for Testing");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
        process.exit(1);
    }
}

async function runDemo() {
    await connectDB();
    console.log("=== DEMO: HỘI ĐỒNG AI THƯ ĐỒNG ===\n");

    const scenarios = [
        {
            name: "Yêu cầu mượn sách Sóng (Proactive search)",
            messages: [{ role: 'user', content: 'tôi muốn mượn sách sóng sẽ đến nhận vào ngày mai hãy tạo đơn mượn cho tôi' }],
            context: { userId: 'admin', userName: 'Quản trị viên', cardStatus: 'active', currentBorrowsCount: 2 }
        },
        {
            name: "Tìm sách chung chung (Vague search)",
            messages: [{ role: 'user', content: 'Tôi muốn tìm sách về lập trình.' }],
            context: { userId: 'admin', userName: 'Quản trị viên', cardStatus: 'active', currentBorrowsCount: 2 }
        },
        {
            name: "Tìm sách theo tác giả (Author search)",
            messages: [{ role: 'user', content: 'Tìm sách của Nguyễn Nhật Ánh.' }],
            context: { userId: 'admin', userName: 'Quản trị viên', cardStatus: 'active', currentBorrowsCount: 2 }
        },
        {
            name: "Sách không tồn tại (Book not found)",
            messages: [{ role: 'user', content: 'Tìm cuốn "Lập trình Quantum cho người mới bắt đầu".' }],
            context: { userId: 'admin', userName: 'Quản trị viên', cardStatus: 'active', currentBorrowsCount: 0 }
        },
        {
            name: "Đặt sách khi thẻ bị khóa (Locked card)",
            messages: [{ role: 'user', content: 'Tôi muốn mượn cuốn Số Đỏ.' }],
            context: { userId: 'librarian', userName: 'Thủ thư', cardStatus: 'locked', currentBorrowsCount: 0 }
        },
        {
            name: "Quy trình đầy đủ (Full workflow - Part 1: Search & Check)",
            messages: [{ role: 'user', content: 'Tôi muốn mượn cuốn "Vợ Nhặt".' }],
            context: { userId: 'admin', userName: 'Quản trị viên', cardStatus: 'active', currentBorrowsCount: 1 }
        },
        {
            name: "Yêu cầu đặt sách thiếu thông tin (Missing date)",
            messages: [
                { role: 'user', content: 'Tìm cuốn Vợ Nhặt.' },
                { role: 'assistant', content: '[...]\nTôi đã thấy sách Vợ Nhặt. Bạn có muốn đặt không?' },
                { role: 'user', content: 'Có, đặt cho tôi đi.' }
            ],
            context: { userId: 'admin', userName: 'Quản trị viên', cardStatus: 'active', currentBorrowsCount: 1 }
        },
        {
            name: "Tương tác ngoài lề (Off-topic interaction)",
            messages: [{ role: 'user', content: 'Bạn là ai và bạn có thể làm gì cho tôi?' }],
            context: { userId: 'admin', userName: 'Quản trị viên', cardStatus: 'active', currentBorrowsCount: 0 }
        }
    ];

    for (const scenario of scenarios) {
        console.log(`--- Kịch bản: ${scenario.name} ---`);
        console.log(`Người dùng: "${scenario.messages[scenario.messages.length - 1].content}"`);

        try {
            const response = await processAIChat(scenario.messages, scenario.context);
            console.log(`\nTHƯ ĐỒNG PHẢN HỒI:\n${response}\n`);
        } catch (error) {
            console.error(`Lỗi: ${error.message}`);
        }
        console.log("-----------------------------------\n");
    }
    await mongoose.disconnect();
    console.log("=== KẾT THÚC DEMO ===");
}

runDemo().catch(console.error);
