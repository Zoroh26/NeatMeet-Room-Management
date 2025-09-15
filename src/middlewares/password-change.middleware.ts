import { Request, Response, NextFunction } from 'express';
const User = require('../models/user.model');

export const requirePasswordChange = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // If user has initial password, force password change
        if (user.isInitialPassword === true) {
            return res.status(403).json({
                success: false,
                message: 'Password change required. Please change your password before accessing this resource.',
                requiresPasswordChange: true
            });
        }

        next();
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error checking password change requirement'
        });
    }
};

export const allowPasswordChangeRoutes = (req: Request, res: Response, next: NextFunction) => {
    // Allow access to password change routes even if password change is required
    const allowedRoutes = [
        '/api/auth/v1/change-password',
        '/api/auth/v1/me',
        '/api/auth/v1/logout'
    ];
    
    if (allowedRoutes.includes(req.path)) {
        return next();
    }
    
    // For other routes, check if password change is required
    return requirePasswordChange(req, res, next);
};
