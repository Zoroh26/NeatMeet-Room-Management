import * as bcrypt from 'bcrypt';
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Ensure .env is loaded
dotenv.config();

const User = require('../../../models/user.model');

interface LoginData {
    email: string;
    password: string;
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
            message: 'Login successful'
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

    async registerUser(userData: {
        name: string;
        email: string;
        password: string;
        role?: string;
        designation: string;
    }) {
        const { name, email, password, role = 'employee', designation } = userData;

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

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            role,
            designation,
            isDeleted: false,
            deletedAt: null
        });

        await newUser.save();

        const token = this.generateToken({
            userId: newUser._id.toString(),
            email: newUser.email,
            role: newUser.role
        });

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return {
            user: userResponse,
            token,
            message: 'User registered successfully'
        };
    }
}

export const authService = new AuthService();