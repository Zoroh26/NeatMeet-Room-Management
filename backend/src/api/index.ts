import express = require('express');
const userRoutes = require('./user/v1/user.route');
const roomRoutes = require('./room/v1/room.routes');
const authRoutes = require('./auth/v1/auth.routes');
const bookingRoutes = require("./booking/v1/booking.route")

const router = express.Router();

// API Routes
router.use('/v1/users', userRoutes);
router.use('/v1/rooms', roomRoutes);
router.use('/v1/auth', authRoutes);
router.use('/v1/bookings', bookingRoutes);

module.exports = router;