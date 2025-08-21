import { Router } from 'express';
import { authenticateToken,authorize } from '../../../middlewares/auth.middleware';
import { login, logout, getCurrentUser, resetUserPassword, changePassword } from './auth.controller';
import { validateLogin, validateChangePassword } from './auth.validation';

const router = Router();

// Public routes
router.post('/login', validateLogin, login);

// Protected routes (require authentication)
router.post('/logout', authenticateToken, logout);         
router.get('/me', authenticateToken, getCurrentUser);
router.put('/reset-password/:userId', authenticateToken, authorize(['admin']), resetUserPassword);
router.put('/change-password', validateChangePassword,changePassword)

module.exports = router;
