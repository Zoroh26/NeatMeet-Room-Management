// Ensure .env is loaded first
const dotenv = require('dotenv');
dotenv.config();

import * as bcrypt from 'bcrypt';
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
import { formatUserResponse } from '../../../utils/response.util';
import { emailService } from '../../../utils/email.util';
import { Otp } from '../../../models/otp.model';

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

    async forgetPassword(email:string){
        if(!email){
            throw new Error("Email is required");
        }
        const user = await User.findOne({
            email:email.toLowerCase()
        })
        if(!user){
            throw new Error("User not found")
        }
    // Generate secure OTP using crypto
   
    const otp = crypto.randomInt(100000, 1000000).toString();
    const saltRounds = process.env.NODE_ENV === "test" ? 1 : 12;
    const hashedOtp = await bcrypt.hash(otp, saltRounds);
    const otpExpiry = new Date(Date.now() + 10*60*1000); // 10 minutes from now
    await Otp.create({ email: user.email, otp: hashedOtp, expiry: otpExpiry });
    await emailService.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Password Reset OTP',
        html: `<p>Your OTP for password reset is <b>${otp}</b>. It is valid for 10 minutes.</p>`
    });
    }

    async verifyOtp(email:string,otp:string,newPassword:string){
        if(!email || !otp || !newPassword){
            throw new Error("Email, OTP and new password are required");
        }
        const user = await User.findOne({
            email:email.toLowerCase(),
        })
        if(!user){
            throw new Error("User not found");
        }
    const otpDoc = await Otp.findOne({ email: user.email });
    if (!otpDoc) throw new Error('Invalid OTP');
    if (otpDoc.expiry < new Date()) throw new Error('OTP expired');
    // Compare provided OTP with hashed OTP
    const isOtpValid = await bcrypt.compare(otp, otpDoc.otp);
    if (!isOtpValid) throw new Error('Invalid OTP');
        user.password = newPassword; // Let Mongoose pre-save hook hash it
        if (user.isInitialPassword) {
            user.isInitialPassword = false;
        }
        await user.save();
        await Otp.deleteOne({ _id: otpDoc._id });
    }


}

export const authService = new AuthService();