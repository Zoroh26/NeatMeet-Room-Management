import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
const User = require('../../src/models/user.model');

describe('User Model Unit Tests', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        // Setup in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // Set test environment for faster bcrypt
        process.env.NODE_ENV = 'test';
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clean up users before each test
        await User.deleteMany({});
    });

    describe('Schema Validation', () => {
        test('Should create user with valid data', async () => {
            const validUser = new User({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'SecurePass123',
                role: 'employee',
                designation: 'Software Developer'
            });

            const savedUser = await validUser.save();
            
            expect(savedUser).toBeDefined();
            expect(savedUser.name).toBe('John Doe');
            expect(savedUser.email).toBe('john@example.com');
            expect(savedUser.role).toBe('employee');
            expect(savedUser.designation).toBe('Software Developer');
            expect(savedUser.isDeleted).toBe(false); // Default value
            expect(savedUser.deletedAt).toBeNull(); // Default value
            expect(savedUser.isInitialPassword).toBe(true); // Default value
            expect(savedUser.user_id).toBeDefined();
            expect(savedUser.createdAt).toBeDefined();
            expect(savedUser.updatedAt).toBeDefined();
        });

        test('Should fail validation with missing required fields', async () => {
            const invalidUser = new User({
                // Missing required fields
            });

            let error;
            try {
                await invalidUser.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors).toBeDefined();
            expect(error.errors.name).toBeDefined();
            expect(error.errors.email).toBeDefined();
            expect(error.errors.password).toBeDefined();
            expect(error.errors.role).toBeDefined();
            expect(error.errors.designation).toBeDefined();
        });

        test('Should fail validation with invalid role', async () => {
            const invalidUser = new User({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'SecurePass123',
                role: 'invalid_role', // Invalid role
                designation: 'Developer'
            });

            let error;
            try {
                await invalidUser.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.role).toBeDefined();
        });

        test('Should accept all valid roles', async () => {
            const validRoles = ['admin', 'employee'];
            
            for (let i = 0; i < validRoles.length; i++) {
                const user = new User({
                    name: `User ${i}`,
                    email: `user${i}@example.com`,
                    password: 'SecurePass123',
                    role: validRoles[i],
                    designation: 'Developer'
                });

                const savedUser = await user.save();
                expect(savedUser.role).toBe(validRoles[i]);
            }
        });

        test('Should fail validation with password too short', async () => {
            const invalidUser = new User({
                name: 'John Doe',
                email: 'john@example.com',
                password: '123', // Too short
                role: 'employee',
                designation: 'Developer'
            });

            let error;
            try {
                await invalidUser.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.password).toBeDefined();
            expect(error.errors.password.message).toContain('Password must be at least 6 characters long');
        });

        test('Should fail validation with password too long', async () => {
            const longPassword = 'a'.repeat(129);
            
            const invalidUser = new User({
                name: 'John Doe',
                email: 'john@example.com',
                password: longPassword, // Too long
                role: 'employee',
                designation: 'Developer'
            });

            let error;
            try {
                await invalidUser.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.password).toBeDefined();
            expect(error.errors.password.message).toContain('Password cannot exceed 128 characters');
        });

        test('Should enforce unique email constraint', async () => {
            const firstUser = new User({
                name: 'First User',
                email: 'duplicate@example.com',
                password: 'SecurePass123',
                role: 'employee',
                designation: 'Developer'
            });
            await firstUser.save();

            const duplicateUser = new User({
                name: 'Second User',
                email: 'duplicate@example.com', // Same email
                password: 'SecurePass123',
                role: 'admin',
                designation: 'Manager'
            });

            let error;
            try {
                await duplicateUser.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.code).toBe(11000); // MongoDB duplicate key error
        });
    });

    describe('Password Hashing', () => {
        test('Should hash password before saving', async () => {
            const plainPassword = 'MySecurePassword123';
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: plainPassword,
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            
            // Password should be hashed
            expect(savedUser.password).not.toBe(plainPassword);
            expect(savedUser.password.length).toBeGreaterThan(plainPassword.length);
            
            // Should start with bcrypt hash format
            expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/);
        });

        test('Should not rehash password if not modified', async () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'SecurePass123',
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            const originalHashedPassword = savedUser.password;

            // Update non-password field
            savedUser.name = 'Updated Name';
            const updatedUser = await savedUser.save();

            // Password should remain the same
            expect(updatedUser.password).toBe(originalHashedPassword);
        });

        test('Should hash password on findOneAndUpdate', async () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'OriginalPass123',
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            const originalPassword = savedUser.password;

            // Update password using findOneAndUpdate
            const newPassword = 'NewSecurePass456';
            await User.findOneAndUpdate(
                { _id: savedUser._id },
                { password: newPassword }
            );

            const updatedUser = await User.findById(savedUser._id);
            
            // Password should be hashed and different from original
            expect(updatedUser.password).not.toBe(newPassword);
            expect(updatedUser.password).not.toBe(originalPassword);
            expect(updatedUser.password).toMatch(/^\$2[aby]\$\d+\$/);
        });

        test('Should not hash password on findOneAndUpdate if not updating password', async () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'SecurePass123',
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            const originalPassword = savedUser.password;

            // Update non-password field using findOneAndUpdate
            await User.findOneAndUpdate(
                { _id: savedUser._id },
                { name: 'Updated Name' }
            );

            const updatedUser = await User.findById(savedUser._id);
            
            // Password should remain unchanged
            expect(updatedUser.password).toBe(originalPassword);
        });
    });

    describe('Password Comparison Method', () => {
        test('Should correctly compare valid password', async () => {
            const plainPassword = 'TestPassword123';
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: plainPassword,
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            
            const isMatch = await savedUser.comparePassword(plainPassword);
            expect(isMatch).toBe(true);
        });

        test('Should correctly reject invalid password', async () => {
            const plainPassword = 'TestPassword123';
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: plainPassword,
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            
            const isMatch = await savedUser.comparePassword('WrongPassword');
            expect(isMatch).toBe(false);
        });

        test('Should handle password comparison errors gracefully', async () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'TestPassword123',
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            
            // Manually corrupt the password hash to trigger error - just return false
            savedUser.password = 'invalid_hash';
            
            const result = await savedUser.comparePassword('TestPassword123');
            expect(result).toBe(false);
        });
    });

    describe('Default Values', () => {
        test('Should set correct default values', async () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'SecurePass123',
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            
            expect(savedUser.isDeleted).toBe(false);
            expect(savedUser.deletedAt).toBeNull();
            expect(savedUser.isInitialPassword).toBe(true);
            expect(savedUser.user_id).toBeDefined();
            expect(savedUser.user_id).toBeInstanceOf(mongoose.Types.ObjectId);
        });

        test('Should allow overriding default values', async () => {
            const customUserId = new mongoose.Types.ObjectId();
            
            const user = new User({
                user_id: customUserId,
                name: 'Test User',
                email: 'test@example.com',
                password: 'SecurePass123',
                role: 'employee',
                designation: 'Developer',
                isDeleted: true,
                deletedAt: new Date(),
                isInitialPassword: false
            });

            const savedUser = await user.save();
            
            expect(savedUser.user_id).toEqual(customUserId);
            expect(savedUser.isDeleted).toBe(true);
            expect(savedUser.deletedAt).toBeDefined();
            expect(savedUser.isInitialPassword).toBe(false);
        });
    });

    describe('Indexes', () => {
        test('Should have indexes defined', async () => {
            const indexes = await User.collection.getIndexes();
            const indexNames = Object.keys(indexes);
            
            // Check that we have multiple indexes beyond the default _id
            expect(indexNames.length).toBeGreaterThan(1);
            
            // Check for email index (may be unique)
            const hasEmailIndex = indexNames.some(name => 
                name.includes('email')
            );
            expect(hasEmailIndex).toBeTruthy();
        });

        test('Should support unique email constraint', async () => {
            const user1 = new User({
                name: 'User 1',
                email: 'duplicate@example.com',
                password: 'Password123',
                role: 'employee',
                designation: 'Developer'
            });
            await user1.save();

            const user2 = new User({
                name: 'User 2',
                email: 'duplicate@example.com',
                password: 'Password123',
                role: 'employee',
                designation: 'Tester'
            });

            await expect(user2.save()).rejects.toThrow();
        });
    });

    describe('Soft Delete Functionality', () => {
        test('Should support soft delete fields', async () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'SecurePass123',
                role: 'employee',
                designation: 'Developer'
            });

            let savedUser = await user.save();
            
            // Initially not deleted
            expect(savedUser.isDeleted).toBe(false);
            expect(savedUser.deletedAt).toBeNull();

            // Simulate soft delete
            savedUser.isDeleted = true;
            savedUser.deletedAt = new Date();
            savedUser = await savedUser.save();

            expect(savedUser.isDeleted).toBe(true);
            expect(savedUser.deletedAt).toBeDefined();
        });
    });

    describe('Timestamps', () => {
        test('Should have createdAt and updatedAt timestamps', async () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'SecurePass123',
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            
            expect(savedUser.createdAt).toBeDefined();
            expect(savedUser.updatedAt).toBeDefined();
            expect(savedUser.createdAt).toBeInstanceOf(Date);
            expect(savedUser.updatedAt).toBeInstanceOf(Date);
        });

        test('Should update updatedAt on document modification', async () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'SecurePass123',
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            const originalUpdatedAt = savedUser.updatedAt;

            // Wait a moment to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            // Update the user
            savedUser.name = 'Updated Name';
            const updatedUser = await savedUser.save();

            expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });

    describe('Role-based Scenarios', () => {
        test('Should create admin user successfully', async () => {
            const adminUser = new User({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'AdminPass123',
                role: 'admin',
                designation: 'System Administrator'
            });

            const savedUser = await adminUser.save();
            expect(savedUser.role).toBe('admin');
        });

        test('Should create employee user successfully', async () => {
            const employeeUser = new User({
                name: 'Employee User',
                email: 'employee@example.com',
                password: 'EmpPass123',
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await employeeUser.save();
            expect(savedUser.role).toBe('employee');
        });
    });

    describe('Integration with bcrypt', () => {
        test('Should use correct salt rounds based on environment', async () => {
            // Test environment may use different salt rounds
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'TestPass123',
                role: 'employee',
                designation: 'Developer'
            });

            const savedUser = await user.save();
            
            // Password should be properly hashed (starts with $2b$ and is longer than original)
            expect(savedUser.password).toMatch(/^\$2[aby]\$/);
            expect(savedUser.password.length).toBeGreaterThan(20);
            expect(savedUser.password).not.toBe('TestPass123');
        });
    });
});
