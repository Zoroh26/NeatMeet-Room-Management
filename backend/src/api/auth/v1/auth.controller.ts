import { Request, Response } from 'express';
import { authService } from './auth.services';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const result = await authService.loginUser({ email, password });

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
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, designation } = req.body;  // ✅ Password from request
        const adminUserId = (req as any).user?.userId;

        if (!name || !email || !password || !designation) {  // ✅ Password is now required
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and designation are required'
            });
        }

        const result = await authService.registerUserByAdmin({
            name,
            email,
            password,  // ✅ Pass admin-provided password
            role: role || 'employee',
            designation
        }, adminUserId);

        res.status(201).json({
            success: true,
            message: result.message,
            data: {
                user: result.user,
                createdBy: result.createdBy
            }
        });

    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('already exists')) statusCode = 409;
        if (error.message.includes('Only administrators')) statusCode = 403;
        if (error.message.includes('Failed to send')) statusCode = 500;
        
        res.status(statusCode).json({
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

export const resetUserPassword = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;
        const adminUserId = (req as any).user?.userId;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password is required'
            });
        }

        if (!adminUserId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const result = await authService.resetUserPassword(userId!, newPassword, adminUserId);
        
        res.status(200).json({
            success: true,
            message: result.message,
            data: result.user
        });

    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('Only administrators')) statusCode = 403;
        if (error.message.includes('User not found')) statusCode = 404;
        
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// Add this to auth.controller.ts
// Update the changePassword controller in: backend/src/api/auth/v1/auth.controller.ts
export const changePassword = async (req: Request, res: Response) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, current password, and new password are required'
            });
        }

        const result = await authService.changePassword(email, currentPassword, newPassword);
        
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