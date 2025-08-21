import {Router} from 'express'
import { authenticateToken, authorize } from '../../../middlewares/auth.middleware'

import { requirePasswordChange } from '../../../middlewares/password-change.middleware'
import { 
    createBooking, 
    getBookings, 
    getBookingById, 
    updateBooking, 
    cancelBooking 
} from './booking.controller'
import { validateCreateBooking, validateUpdateBooking } from './booking.validation'

const router = Router();

// All routes require authentication and password change
router.use(authenticateToken);
router.use(requirePasswordChange);

// GET routes
router.get('/', getBookings);                                      // Get all bookings with filters
router.get('/:id', getBookingById);                               // Get single booking by ID

// POST routes  
router.post('/booking', validateCreateBooking, createBooking);           // Create new booking

// PUT routes
router.put('/:id', validateUpdateBooking, updateBooking);         // Update booking

// PATCH routes (for specific actions)
router.patch('/:id', cancelBooking);                       // Cancel booking

module.exports = router;
