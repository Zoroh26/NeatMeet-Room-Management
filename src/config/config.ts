import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    mongoUrl: string;
    jwtSecret: string;
    jwtExpire: string;
    corsOrigins: string[];
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
}

const config: Config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUrl: process.env.MongoDB_URL || 'mongodb://localhost:27017/neatmeet',
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
};

export default config;
