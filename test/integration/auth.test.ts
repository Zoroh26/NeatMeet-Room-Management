import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const connectDB = require('../../src/config/db');

describe('Authentication API', () => {
    let authToken: string;
    let testUserId: string;

    beforeAll(async () => {
        console.log('Setting up test database...');
        await connectDB(process.env.MongoDB_URL as string);
        
        // Create a test user directly in the database for testing
        const testUser = new User({
            name: "Test User",
            email: "test@neatmeet.com",
            password: "TestPassword@123", // This will be hashed by the pre-save hook
            role: "employee",
            designation: "Test Engineer",
            isDeleted: false
        });
        
        await testUser.save();
        testUserId = testUser._id;
        console.log('Test user created for authentication tests');
    });

    afterAll(async () => {
        // Clean up test user
        if (testUserId) {
            await User.findByIdAndDelete(testUserId);
        }
        await mongoose.connection.close();
        console.log('Test cleanup completed');
    });

    describe('POST /api/auth/v1/login', () => {
        test('Should login successfully with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/v1/login')
                .send({
                    email: "test@neatmeet.com",
                    password: "TestPassword@123"
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('email', 'test@neatmeet.com');
            expect(response.body.data.user).not.toHaveProperty('password');

            authToken = response.body.data.token;
        });

        test('Should fail with missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/v1/login')
                .send({});

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Validation failed');
        });

        test('Should fail with invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/v1/login')
                .send({
                    email: "invalid-email",
                    password: "password123"
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Validation failed');
        });

        test('Should fail with wrong password', async () => {
            const response = await request(app)
                .post('/api/auth/v1/login')
                .send({ email: 'test@neatmeet.com', password: 'WrongPassword@123' });
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        });

        test('Should fail with non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/v1/login')
                .send({ email: 'nonexistent@example.com', password: 'SomePassword@123' });
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        });
    });

    describe('GET /api/auth/v1/me', () => {
        beforeEach(async () => {
            // Login to get a valid token
            const loginResponse = await request(app)
                .post('/api/auth/v1/login')
                .send({
                    email: "test@neatmeet.com",
                    password: "TestPassword@123"
                });
            authToken = loginResponse.body.data.token;
        });

        test('Should get current user with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/v1/me')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('email', 'test@neatmeet.com');
            expect(response.body.data).toHaveProperty('name', 'Test User');
            expect(response.body.data).not.toHaveProperty('password');
        });

        test('Should fail without authentication token', async () => {
            const response = await request(app)
                .get('/api/auth/v1/me');
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Access token required');
        });

        test('Should fail with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/v1/me')
                .set('Authorization', 'Bearer invalid-token-here');
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Invalid or expired token');
        });

        test('Should fail with malformed authorization header', async () => {
            const response = await request(app)
                .get('/api/auth/v1/me')
                .set('Authorization', 'InvalidFormat token');
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Invalid or expired token');
        });
    });

    describe('PUT /api/auth/v1/change-password', () => {
        let passwordTestUser: any;
        let passwordAuthToken: string;

        beforeAll(async () => {
            // Create a separate test user for password change tests
            passwordTestUser = new User({
                name: "Password Test User",
                email: "password-test@neatmeet.com",
                password: "TestPassword@123",
                role: "employee",
                designation: "Test Engineer",
                isDeleted: false
            });
            await passwordTestUser.save();
        });

        beforeEach(async () => {
            // Reset password and login to get a fresh token
            passwordTestUser.password = "TestPassword@123";
            await passwordTestUser.save();

            // Login to get a valid token
            const loginResponse = await request(app)
                .post('/api/auth/v1/login')
                .send({
                    email: "password-test@neatmeet.com",
                    password: "TestPassword@123"
                });
            passwordAuthToken = loginResponse.body.data.token;
        });

        afterAll(async () => {
            // Clean up password test user
            if (passwordTestUser) {
                await User.findByIdAndDelete(passwordTestUser._id);
            }
        });

        test('Should change password successfully', async () => {
            const response = await request(app)
                .put('/api/auth/v1/change-password')
                .set('Authorization', `Bearer ${passwordAuthToken}`)
                .send({ 
                    currentPassword: 'TestPassword@123', 
                    newPassword: 'NewPassword@123' 
                });
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Password changed successfully');
        });

        test('Should fail without authentication', async () => {
            const response = await request(app)
                .put('/api/auth/v1/change-password')
                .send({ currentPassword: 'OldPassword@123', newPassword: 'NewPassword@123' });
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Access token required');
        });

        test('Should fail with missing fields', async () => {
            const response = await request(app)
                .put('/api/auth/v1/change-password')
                .set('Authorization', `Bearer ${passwordAuthToken}`)
                .send({ currentPassword: 'OldPassword@123' }); // Missing newPassword
            
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Validation failed');
        });

        test('Should fail with wrong current password', async () => {
            const response = await request(app)
                .put('/api/auth/v1/change-password')
                .set('Authorization', `Bearer ${passwordAuthToken}`)
                .send({ currentPassword: 'WrongCurrentPassword@123', newPassword: 'NewPassword@123' });
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Current password is incorrect');
        });

        test('Should fail with weak new password', async () => {
            const response = await request(app)
                .put('/api/auth/v1/change-password')
                .set('Authorization', `Bearer ${passwordAuthToken}`)
                .send({ currentPassword: 'TestPassword@123', newPassword: 'weak' }); // Weak new password
            
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Validation failed');
        });
    });

    describe('POST /api/auth/v1/logout', () => {
        let logoutTestUser: any;
        let logoutAuthToken: string;

        beforeAll(async () => {
            // Create a separate test user for logout tests
            logoutTestUser = new User({
                name: "Logout Test User",
                email: "logout-test@neatmeet.com",
                password: "TestPassword@123",
                role: "employee",
                designation: "Test Engineer",
                isDeleted: false
            });
            await logoutTestUser.save();
        });

        beforeEach(async () => {
            // Login to get a valid token
            const loginResponse = await request(app)
                .post('/api/auth/v1/login')
                .send({
                    email: "logout-test@neatmeet.com",
                    password: "TestPassword@123"
                });
            logoutAuthToken = loginResponse.body.data.token;
        });

        afterAll(async () => {
            // Clean up logout test user
            if (logoutTestUser) {
                await User.findByIdAndDelete(logoutTestUser._id);
            }
        });

        test('Should logout successfully with valid token', async () => {
            const response = await request(app)
                .post('/api/auth/v1/logout')
                .set('Authorization', `Bearer ${logoutAuthToken}`);
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Logged out successfully');
        });

        test('Should fail without authentication token', async () => {
            const response = await request(app)
                .post('/api/auth/v1/logout');
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Access token required');
        });

        test('Should fail with invalid token', async () => {
            const response = await request(app)
                .post('/api/auth/v1/logout')
                .set('Authorization', 'Bearer invalid-token');
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Invalid or expired token');
        });
    });

    describe('Security & Edge Cases', () => {
        test('Should handle SQL injection attempts in email', async () => {
            const response = await request(app)
                .post('/api/auth/v1/login')
                .send({ email: "admin@example.com'; DROP TABLE users; --", password: 'password123' });
            
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Validation failed');
        });

        test('Should handle extremely long password', async () => {
            const longPassword = 'A'.repeat(1000) + '@123';
            const response = await request(app)
                .post('/api/auth/v1/login')
                .send({ email: 'test@example.com', password: longPassword });
            
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        });
    });

    describe('GET /health', () => {
        test('Should return server health status', async () => {
            const response = await request(app)
                .get('/health');
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('status', 'OK');
        });
    });

    describe('404 Handler', () => {
        test('Should return 404 for unknown routes', async () => {
            const response = await request(app)
                .get('/nonexistent-route');
            
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Route not found');
        });

        test('Should return 404 for unknown API routes', async () => {
            const response = await request(app)
                .get('/api/unknown/endpoint');
            
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Route not found');
        });
    });

    describe('Performance Tests', () => {
        test('Login response time should be under 2 seconds', async () => {
            const startTime = Date.now();
            const response = await request(app)
                .post('/api/auth/v1/login')
                .send({ email: 'test@neatmeet.com', password: 'TestPassword@123' });
            const responseTime = Date.now() - startTime;
            
            expect(response.statusCode).toBe(200);
            expect(responseTime).toBeLessThan(2000); // Optimized threshold
        });
    });
});
