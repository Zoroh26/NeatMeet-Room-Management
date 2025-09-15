import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const User = require('../models/user.model');

interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // 1) Getting token and check if it exists
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Debug logging
        logger.info('Token debug', {
            hasAuthHeader: !!req.headers.authorization,
            authHeader: req.headers.authorization ? req.headers.authorization.substring(0, 30) + '...' : 'none',
            tokenLength: token ? token.length : 0,
            tokenStart: token ? token.substring(0, 20) + '...' : 'none',
            url: req.url
        });

        if (!token) {
            logger.warn('Authentication failed: No token provided', {
                url: req.url,
                method: req.method,
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // 2) Verify token
        const decoded: any = await promisify(jwt.verify as any)(token, process.env.JWT_SECRET!);

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.userId).select('-password');
        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }

        // 4) Check if user is not deleted
        if (currentUser.isDeleted) {
            return res.status(401).json({
                success: false,
                message: 'User account has been deactivated'
            });
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (error) {
        logger.error('Token verification failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            url: req.url,
            method: req.method,
            ip: req.ip
        });
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        next();
    };
};
