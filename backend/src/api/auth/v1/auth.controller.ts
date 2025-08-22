import { Request, Response } from 'express';
import { authService } from './auth.services';
import { logger } from '../../../utils/logger';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        logger.info('Login attempt', { 
            email, 
            ip: req.ip, 
            userAgent: req.get('User-Agent') 
        });

        // Basic validation
        if (!email || !password) {
            logger.warn('Login failed: Missing credentials', { email, ip: req.ip });
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const result = await authService.loginUser({ email, password });

        logger.info('Login successful', { 
            email, 
            userId: result.user?.id, 
            ip: req.ip 
        });

        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                user: result.user,
                token: result.token,
                requiresPasswordChange:result.requiresPasswordChange
            }
        });

    } catch (error: any) {
        logger.error('Login failed', {
            error: error.message,
            email: req.body.email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};


export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Error during logout",
            error: error.message
        });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        // Get user ID from authenticated request (requires auth middleware)
        const userId = (req as any).user?.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const user = await authService.getUserById(userId);
        
        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: user
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Error retrieving user",
            error: error.message
        });
    }
};



// Add this to auth.controller.ts
// Update the changePassword controller in: backend/src/api/auth/v1/auth.controller.ts
export const changePassword = async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = (req as any).user?.userId; // Get userId from JWT token

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const result = await authService.changePasswordByUserId(userId, currentPassword, newPassword);
        
        res.status(200).json({
            success: true,
            message: result.message,
            data: result.user
        });

    } catch (error: any) {
        let statusCode = 400;
        if (error.message.includes('User not found')) statusCode = 404;
        if (error.message.includes('Current password is incorrect')) statusCode = 401;
        
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};