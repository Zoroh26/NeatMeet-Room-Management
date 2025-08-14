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
                token: result.token
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
        const { name, email, password, role, designation } = req.body;

        // Basic validation
        if (!name || !email || !password || !designation) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and designation are required'
            });
        }

        const result = await authService.registerUser({
            name,
            email,
            password,
            role,
            designation
        });

        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.status(201).json({
            success: true,
            message: result.message,
            data: {
                user: result.user,
                token: result.token
            }
        });

    } catch (error: any) {
        const statusCode = error.message.includes('already exists') ? 409 : 500;
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