// Ensure .env is loaded first
const dotenv = require('dotenv');
dotenv.config();

import * as bcrypt from 'bcrypt';
const jwt = require('jsonwebtoken');
import { formatUserResponse } from '../../../utils/response.util';
import { logger } from '../../../utils/logger';

const User = require('../../../models/user.model');

interface LoginData {
    email: string;
    password: string;
}
interface RegisterData {
    name: string;
    email: string;
    password:string,
    role: string;
    designation: string;
}
interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

class AuthService {
    private generateToken(payload: TokenPayload): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return jwt.sign(payload, secret, {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });
    }

    async loginUser(loginData: LoginData) {
        const { email, password } = loginData;

        const user = await User.findOne({
            email: email.toLowerCase(),
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        });

        if (!user) {
            throw new Error("Invalid email or password");
        }

        
        const isPasswordValid = await user.comparePassword(password);
       
        
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }
        const requiresPasswordChange = user.isInitialPassword === true;
        const token = this.generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        const cleanUser = formatUserResponse(user);

        return {
            user: cleanUser,
            token,
            message: 'Login successful',
            requiresPasswordChange
        };
    }

    // Change password for logged-in users using userId from JWT token
    async changePasswordByUserId(userId: string, currentPassword: string, newPassword: string) {
        const user = await User.findOne({
            _id: userId,
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ],
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Validate new password length
        if (newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long');
        }

        // Ensure new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new Error('New password must be different from current password');
        }

        // Update password
        user.password = newPassword;
        user.isInitialPassword = false;
        
        await user.save();
        
        const cleanUser = formatUserResponse(user);

        return {
            message: 'Password changed successfully',
            user: cleanUser
        };
    }   


    verifyToken(token: string): TokenPayload {
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error('JWT_SECRET is not defined in environment variables');
            }
            return jwt.verify(token, secret) as TokenPayload;
        } catch (error) {
            throw new Error("Invalid or expired token");
        }
    }

    async getUserById(userId: string) {
        const user = await User.findOne({
            _id: userId,
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        }).select('-password');

        if (!user) {
            throw new Error('User not found');
        }
        
        return formatUserResponse(user);
    }

    
}

export const authService = new AuthService();