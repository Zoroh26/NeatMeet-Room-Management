import { Router } from 'express';
import { authenticateToken,authorize } from '../../../middlwares/auth.middleware';
import { login, register, logout, getCurrentUser } from './auth.controller';
import { validateLogin, validateRegister } from './auth.validation';

const router = Router();

// Auth routes
router.post('/login',validateLogin, login);
router.post('/register',authenticateToken,authorize(['admin']),validateRegister, register);      
router.post('/logout',logout);         
router.get('/me',authenticateToken, getCurrentUser);     
module.exports = router;
