const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
    createReservation,
    getMyReservations,
    getAllReservations,
    confirmReservation,
    cancelReservation,
    markPickedUp,
} = require('../controllers/reservationController');

// User routes
router.post('/', protect, createReservation);
router.get('/my', protect, getMyReservations);
router.patch('/:id/cancel', protect, cancelReservation);

// Admin/Librarian routes
router.get('/', protect, adminOnly, getAllReservations);
router.patch('/:id/confirm', protect, adminOnly, confirmReservation);
router.patch('/:id/pickup', protect, adminOnly, markPickedUp);

module.exports = router;
