import express = require('express');
const userRoutes = require('./user/v1/user.route');
const roomRoutes = require('./room/v1/room.routes');
const authRoutes = require('./auth/v1/auth.routes');

const router = express.Router();

// API Routes
router.use('/v1/users', userRoutes);
router.use('/v1/rooms', roomRoutes);
router.use('/v1/auth', authRoutes);

module.exports = router;