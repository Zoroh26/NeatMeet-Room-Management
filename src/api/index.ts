import express = require('express');
const userRoutes = require('./user/v1/user.route');
const roomRoutes = require('./room/v1/room.routes');
const authRoutes = require('./auth/v1/auth.routes');
const bookingRoutes = require("./booking/v1/booking.route")

const router = express.Router();

// API Routes
router.use('/users/v1', userRoutes);
router.use('/rooms/v1', roomRoutes);
router.use('/auth/v1', authRoutes);
router.use('/bookings/v1', bookingRoutes);

module.exports = router;