import { Router } from 'express';
import { authenticateToken,authorize } from '../../../middlwares/auth.middleware';
import { login, register, logout, getCurrentUser, resetUserPassword, changePassword } from './auth.controller';
import { validateLogin, validateRegister,validateChangePassword } from './auth.validation';

const router = Router();

// Public routes
router.post('/login', validateLogin, login);

// Protected routes (require authentication)
router.post('/register', authenticateToken, authorize(['admin']), validateRegister, register);      
router.post('/logout', authenticateToken, logout);         
router.get('/me', authenticateToken, getCurrentUser);
router.put('/reset-password/:userId', authenticateToken, authorize(['admin']), resetUserPassword);
router.put('/change-password',authenticateToken,validateChangePassword,changePassword)

module.exports = router;
