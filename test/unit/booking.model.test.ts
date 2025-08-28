import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

const Booking = require('../../src/models/booking.model');
const User = require('../../src/models/user.model');
const Room = require('../../src/models/room.model');

describe('Booking Model Unit Tests', () => {
    let mongoServer: MongoMemoryServer;
    let testUserId: mongoose.Types.ObjectId;
    let testRoomId: mongoose.Types.ObjectId;

    beforeAll(async () => {
        // Setup in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri);
        
        // Create test user and room
        const testUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'TestPass123',
            role: 'employee',
            designation: 'Developer'
        });
        const savedUser = await testUser.save();
        testUserId = savedUser._id;
        
        const testRoom = new Room({
            name: 'Test Room',
            location: 'Floor 1',
            capacity: 10
        });
        const savedRoom = await testRoom.save();
        testRoomId = savedRoom._id;
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clean up bookings before each test
        await Booking.deleteMany({});
    });

    describe('Schema Validation', () => {
        test('Should create booking with valid data', async () => {
            const validBooking = new Booking({
                room_id: testRoomId,
                user_id: testUserId,
                start_time: new Date('2025-08-23T10:00:00Z'),
                end_time: new Date('2025-08-23T11:00:00Z'),
                purpose: 'Team meeting'
            });

            const savedBooking = await validBooking.save();
            
            expect(savedBooking).toBeDefined();
            expect(savedBooking.room_id).toEqual(testRoomId);
            expect(savedBooking.user_id).toEqual(testUserId);
            expect(savedBooking.purpose).toBe('Team meeting');
            expect(savedBooking.status).toBe('scheduled'); // Default value
            expect(savedBooking.createdAt).toBeDefined();
            expect(savedBooking.updatedAt).toBeDefined();
        });

        test('Should fail validation with missing required fields', async () => {
            const invalidBooking = new Booking({
                // Missing required fields
            });

            let error;
            try {
                await invalidBooking.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors).toBeDefined();
            expect(error.errors.room_id).toBeDefined();
            expect(error.errors.user_id).toBeDefined();
            expect(error.errors.start_time).toBeDefined();
            expect(error.errors.end_time).toBeDefined();
            expect(error.errors.purpose).toBeDefined();
        });

        test('Should fail validation with invalid status', async () => {
            const invalidBooking = new Booking({
                room_id: testRoomId,
                user_id: testUserId,
                start_time: new Date('2025-08-23T10:00:00Z'),
                end_time: new Date('2025-08-23T11:00:00Z'),
                purpose: 'Team meeting',
                status: 'invalid_status' // Invalid status
            });

            let error;
            try {
                await invalidBooking.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.status).toBeDefined();
            expect(error.errors.status.message).toContain('Status must be either in progress, scheduled, or cancelled');
        });

        test('Should accept all valid status values', async () => {
            const validStatuses = ['in progress', 'scheduled', 'cancelled'];
            
            for (let i = 0; i < validStatuses.length; i++) {
                const booking = new Booking({
                    room_id: testRoomId,
                    user_id: testUserId,
                    start_time: new Date(`2025-08-23T${10 + i}:00:00Z`),
                    end_time: new Date(`2025-08-23T${11 + i}:00:00Z`),
                    purpose: `Meeting ${i}`,
                    status: validStatuses[i]
                });

                const savedBooking = await booking.save();
                expect(savedBooking.status).toBe(validStatuses[i]);
            }
        });

        test('Should fail validation with purpose exceeding 200 characters', async () => {
            const longPurpose = 'a'.repeat(201);
            
            const invalidBooking = new Booking({
                room_id: testRoomId,
                user_id: testUserId,
                start_time: new Date('2025-08-23T10:00:00Z'),
                end_time: new Date('2025-08-23T11:00:00Z'),
                purpose: longPurpose
            });

            let error;
            try {
                await invalidBooking.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.errors.purpose).toBeDefined();
            expect(error.errors.purpose.message).toContain('Purpose cannot exceed 200 characters');
        });

        test('Should trim whitespace from purpose', async () => {
            const booking = new Booking({
                room_id: testRoomId,
                user_id: testUserId,
                start_time: new Date('2025-08-23T10:00:00Z'),
                end_time: new Date('2025-08-23T11:00:00Z'),
                purpose: '  Team meeting  ' // With whitespace
            });

            const savedBooking = await booking.save();
            expect(savedBooking.purpose).toBe('Team meeting');
        });
    });

    describe('Unique Constraint', () => {
        test('Should prevent duplicate bookings with same room, time, and user', async () => {
            const bookingData = {
                room_id: testRoomId,
                user_id: testUserId,
                start_time: new Date('2025-08-23T10:00:00Z'),
                end_time: new Date('2025-08-23T11:00:00Z'),
                purpose: 'First meeting'
            };

            // Create first booking
            const firstBooking = new Booking(bookingData);
            await firstBooking.save();

            // Try to create duplicate booking
            const duplicateBooking = new Booking({
                ...bookingData,
                purpose: 'Duplicate meeting'
            });

            let error;
            try {
                await duplicateBooking.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.code).toBe(11000); // MongoDB duplicate key error
            expect(error.message).toContain('unique_booking_constraint');
        });

        test('Should allow different users to book same room and time', async () => {
            // Create another test user
            const secondUser = new User({
                name: 'Second User',
                email: 'second@example.com',
                password: 'TestPass123',
                role: 'employee',
                designation: 'Designer'
            });
            const savedSecondUser = await secondUser.save();

            const commonTime = {
                start_time: new Date('2025-08-23T10:00:00Z'),
                end_time: new Date('2025-08-23T11:00:00Z')
            };

            // First user's booking
            const firstBooking = new Booking({
                room_id: testRoomId,
                user_id: testUserId,
                ...commonTime,
                purpose: 'First user meeting'
            });
            await firstBooking.save();

            // Second user's booking (should be allowed due to unique constraint)
            const secondBooking = new Booking({
                room_id: testRoomId,
                user_id: savedSecondUser._id,
                ...commonTime,
                purpose: 'Second user meeting'
            });

            // This should succeed since unique constraint includes user_id
            const savedSecondBooking = await secondBooking.save();
            expect(savedSecondBooking).toBeDefined();
        });
    });

    describe('Indexes', () => {
        test('Should have correct indexes defined', async () => {
            const indexes = await Booking.collection.getIndexes();
            const indexNames = Object.keys(indexes);
            
            // Check that we have multiple indexes beyond the default _id
            expect(indexNames.length).toBeGreaterThan(1);
            
            // Check for compound index existence (naming may vary)
            const hasCompoundIndex = indexNames.some(name => 
                name.includes('room_id') || name.includes('date') || name.includes('start_time')
            );
            expect(hasCompoundIndex).toBeTruthy();
        });
    });

    describe('Date Transformation', () => {
        test('Should return dates as ISO strings in JSON', async () => {
            const booking = new Booking({
                room_id: testRoomId,
                user_id: testUserId,
                start_time: new Date('2025-08-23T10:00:00Z'),
                end_time: new Date('2025-08-23T11:00:00Z'),
                purpose: 'Meeting with date transformation'
            });

            const savedBooking = await booking.save();
            const jsonBooking = savedBooking.toJSON();

            expect(typeof jsonBooking.start_time).toBe('string');
            expect(typeof jsonBooking.end_time).toBe('string');
            expect(typeof jsonBooking.createdAt).toBe('string');
            expect(typeof jsonBooking.updatedAt).toBe('string');
            
            // Verify they are valid ISO strings
            expect(new Date(jsonBooking.start_time).toISOString()).toBe(jsonBooking.start_time);
            expect(new Date(jsonBooking.end_time).toISOString()).toBe(jsonBooking.end_time);
        });

        test('Should return dates as ISO strings when converted to object', async () => {
            const booking = new Booking({
                room_id: testRoomId,
                user_id: testUserId,
                start_time: new Date('2025-08-23T10:00:00Z'),
                end_time: new Date('2025-08-23T11:00:00Z'),
                purpose: 'Meeting with object transformation'
            });

            const savedBooking = await booking.save();
            const objBooking = savedBooking.toObject();

            expect(typeof objBooking.start_time).toBe('string');
            expect(typeof objBooking.end_time).toBe('string');
            expect(typeof objBooking.createdAt).toBe('string');
            expect(typeof objBooking.updatedAt).toBe('string');
        });
    });

    describe('Versioning and Optimistic Concurrency', () => {
        test('Should include version key for optimistic concurrency', async () => {
            const booking = new Booking({
                room_id: testRoomId,
                user_id: testUserId,
                start_time: new Date('2025-08-23T10:00:00Z'),
                end_time: new Date('2025-08-23T11:00:00Z'),
                purpose: 'Versioning test'
            });

            const savedBooking = await booking.save();
            expect(savedBooking.__v).toBeDefined();
            expect(savedBooking.__v).toBe(0);

            // Update the booking
            savedBooking.purpose = 'Updated purpose';
            const updatedBooking = await savedBooking.save();
            expect(updatedBooking.__v).toBe(1);
        });
    });

    describe('Population Compatibility', () => {
        test('Should support population of room_id and user_id', async () => {
            const booking = new Booking({
                room_id: testRoomId,
                user_id: testUserId,
                start_time: new Date('2025-08-23T10:00:00Z'),
                end_time: new Date('2025-08-23T11:00:00Z'),
                purpose: 'Population test'
            });

            const savedBooking = await booking.save();
            
            // Test population
            const populatedBooking = await Booking.findById(savedBooking._id)
                .populate('room_id')
                .populate('user_id');

            expect(populatedBooking.room_id).toBeDefined();
            expect(populatedBooking.user_id).toBeDefined();
            expect(populatedBooking.room_id.name).toBe('Test Room');
            expect(populatedBooking.user_id.name).toBe('Test User');
        });
    });
});
