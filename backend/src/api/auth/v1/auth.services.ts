// Ensure .env is loaded first
const dotenv = require('dotenv');
dotenv.config();

import * as bcrypt from 'bcrypt';
const jwt = require('jsonwebtoken');

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

        console.log('   User found:', user ? 'YES' : 'NO');
        if (user) {
            console.log('   User email in DB:', user.email);
            console.log('   User isDeleted:', user.isDeleted);
        }

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

        const userResponse = user.toObject();
        delete userResponse.password;

        return {
            user: userResponse,
            token,
            message: 'Login successful',
            requiresPasswordChange
        };
    }

     async registerUserByAdmin(registerData: RegisterData, adminUserId: string) {
        const { name, email, password, role, designation } = registerData;  // ✅ Password comes from admin

        // Verify the requesting user is an admin
        const admin = await User.findOne({
            _id: adminUserId,
            role: 'admin',
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        });

        if (!admin) {
            throw new Error('Only administrators can register new users');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            email: email.toLowerCase(),
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Use admin-provided password (let pre-save middleware handle hashing)
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: password, // Don't hash here - let the pre-save middleware do it
            role: role || 'employee',
            designation,
            createdBy: adminUserId,
            isInitialPassword: true
        });

        await newUser.save();

        // Send welcome email with admin-provided credentials
        try {
            // Lazy import to ensure environment variables are loaded
            const { emailService } = await import('../../../utils/email.util');
            await emailService.sendWelcomeEmail(newUser, password);
            console.log('📧 Welcome email sent successfully');
        } catch (emailError: any) {
            console.error('📧 Email sending failed:', emailError.message);
            // Don't throw error, just log it - user creation should still succeed
        }

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return {
            user: userResponse,
            message: 'User registered successfully and credentials sent via email',
            createdBy: admin.name
        };
    }

    // Change password for logged-in users
    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await User.findOne({
            _id: userId
        });

        if (!user) {
            throw new Error('User not found');
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
    }

        
        user.password = newPassword;
        user.isInitialPassword = false;
        
        await user.save();
        
        const userResponse = user.toObject();
        delete userResponse.password;

        return {
            user:userResponse,
            message: 'Password changed successfully' };
    }

    // Admin reset user password
    async resetUserPassword(userId: string, newPassword: string, adminUserId: string) {
        // Verify admin user
        const admin = await User.findOne({
            _id: adminUserId,
            role: 'admin',
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        });

        if (!admin) {
            throw new Error('Only administrators can reset user passwords');
        }

        // Find the user to reset password for
        const user = await User.findOne({
            _id: userId,
            $or: [
                { isDeleted: false },
                { isDeleted: { $exists: false } }
            ]
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Set the new password (will be hashed by pre-save middleware)
        console.log('🔄 Resetting password for user:', user.email);
        console.log('🔄 New password length:', newPassword.length);
        
        user.password = newPassword; // Don't hash here, let pre-save middleware handle it
        user.isInitialPassword = true; // Mark as initial password so user must change it
        
        await user.save();
        console.log('🔄 User saved successfully with new password');

        console.log(`🔄 Password reset for user ${user.email} by admin ${admin.email}`);

        return { 
            message: 'Password reset successfully',
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            }
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
        return user;
    }

    
}

export const authService = new AuthService();