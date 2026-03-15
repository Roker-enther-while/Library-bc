const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const User = require('../models/User');
const { sendReservationConfirmationEmail, sendReservationCancelledEmail } = require('../services/emailService');

// POST /api/reservations — user tạo đặt trước
const createReservation = async (req, res) => {
    try {
        const { bookId, note } = req.body;
        const userId = req.user._id;

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: 'Không tìm thấy sách' });

        // Kiểm tra đã có đặt trước pending/confirmed chưa
        const existing = await Reservation.findOne({
            user: userId, book: bookId, status: { $in: ['pending', 'confirmed'] }
        });
        if (existing) return res.status(400).json({ message: 'Bạn đã có yêu cầu đặt trước sách này đang chờ xử lý' });

        const reservation = await Reservation.create({ user: userId, book: bookId, note });
        console.log(`✅ Reservation created successfully: ${reservation._id} for book ${bookId} by user ${userId}`);

        res.status(201).json({ success: true, message: 'Đặt trước thành công! Thư viện sẽ xác nhận trong 1–2 ngày làm việc.', reservation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// GET /api/reservations/my — user xem đặt trước của mình
const getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user._id })
            .populate('book', 'title authorName coverImage shelfLocation availableCopies')
            .sort({ createdAt: -1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// GET /api/reservations — admin xem tất cả
const getAllReservations = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const reservations = await Reservation.find(filter)
            .populate('user', 'fullName email studentId')
            .populate('book', 'title authorName coverImage availableCopies')
            .sort({ createdAt: -1 });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// PATCH /api/reservations/:id/confirm — admin xác nhận
const confirmReservation = async (req, res) => {
    try {
        const { pickupDays = 3 } = req.body; // số ngày giữ sách
        const reservation = await Reservation.findById(req.params.id)
            .populate('user', 'fullName email')
            .populate('book', 'title authorName coverImage');

        if (!reservation) return res.status(404).json({ message: 'Không tìm thấy đặt trước' });
        if (reservation.status !== 'pending') return res.status(400).json({ message: 'Chỉ có thể xác nhận yêu cầu đang chờ' });

        const pickupDeadline = new Date();
        pickupDeadline.setDate(pickupDeadline.getDate() + pickupDays);

        reservation.status = 'confirmed';
        reservation.confirmedAt = new Date();
        reservation.pickupDeadline = pickupDeadline;
        reservation.processedBy = req.user._id;
        await reservation.save();

        // Gửi email xác nhận
        if (reservation.user?.email) {
            await sendReservationConfirmationEmail({
                toEmail: reservation.user.email,
                borrowerName: reservation.user.fullName,
                bookTitle: reservation.book.title,
                bookAuthor: reservation.book.authorName,
                coverImage: reservation.book.coverImage,
                pickupDeadline,
            });
        }

        res.json({ success: true, message: 'Đã xác nhận và gửi email thông báo cho độc giả', reservation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// PATCH /api/reservations/:id/cancel — admin hoặc user hủy
const cancelReservation = async (req, res) => {
    try {
        const { reason } = req.body;
        const reservation = await Reservation.findById(req.params.id)
            .populate('user', 'fullName email')
            .populate('book', 'title');

        if (!reservation) return res.status(404).json({ message: 'Không tìm thấy đặt trước' });

        // User chỉ hủy được của mình và khi còn pending
        const isAdmin = ['admin', 'librarian'].includes(req.user.role);
        if (!isAdmin && reservation.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Không có quyền' });
        }
        if (!isAdmin && reservation.status !== 'pending') {
            return res.status(400).json({ message: 'Chỉ có thể hủy khi đặt trước đang chờ xử lý' });
        }

        reservation.status = 'cancelled';
        reservation.cancelledAt = new Date();
        reservation.cancelReason = reason || '';
        reservation.processedBy = req.user._id;
        await reservation.save();

        // Gửi email nếu admin hủy
        if (isAdmin && reservation.user?.email) {
            await sendReservationCancelledEmail({
                toEmail: reservation.user.email,
                borrowerName: reservation.user.fullName,
                bookTitle: reservation.book.title,
                reason,
            });
        }

        res.json({ success: true, message: 'Đã hủy đặt trước' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// PATCH /api/reservations/:id/pickup — admin đánh dấu đã nhận
const markPickedUp = async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { status: 'picked_up', processedBy: req.user._id },
            { returnDocument: 'after' }
        );
        if (!reservation) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json({ success: true, reservation });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = { createReservation, getMyReservations, getAllReservations, confirmReservation, cancelReservation, markPickedUp };
