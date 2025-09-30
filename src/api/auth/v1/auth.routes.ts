import { Router } from 'express';
import { authenticateToken, authorize } from '../../../middlewares/auth.middleware';
import { login, logout, getCurrentUser, changePassword } from './auth.controller';
import { validateLogin, validateChangePassword } from './auth.validation';
import { forgetPassword,verifyOtp } from './auth.controller';

const router = Router();

// Public routes
router.post('/login', validateLogin, login);

// Protected routes (require authentication)
router.post('/logout', authenticateToken, logout);         
router.get('/me', authenticateToken, getCurrentUser);
router.put('/change-password', authenticateToken, validateChangePassword, changePassword);
router.post('/forgot-password', forgetPassword);
router.post('/verify-otp', verifyOtp);

module.exports = router;
