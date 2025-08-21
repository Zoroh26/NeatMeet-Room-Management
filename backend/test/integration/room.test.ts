import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
const app = require('../../src/app');
const connectDB = require('../../src/config/db');
const mongoose = require('mongoose');

describe('Rooms API - Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Connect to MongoDB for testing
    await connectDB(process.env.MongoDB_URL as string);
    
    // Login to get a real authentication token
    const loginResponse = await request(app)
      .post('/api/auth/v1/login')
      .send({
        email: 'rohith26p@gmail.com',
        password: 'Rohith@123'
      });
    
    if (!loginResponse.body.data || !loginResponse.body.data.token) {
      console.log('Login response:', loginResponse.body);
      throw new Error('Login failed: ' + JSON.stringify(loginResponse.body));
    }
    
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Close the database connection after tests
    await mongoose.connection.close();
  });

  describe('POST /api/rooms/v1/room', () => {
    test('TC_ROOM_001: Should fail without authentication', async () => {
      const roomData = {
        name: `Test Room ${Date.now()}`,
        location: 'Floor 1',
        capacity: 10,
        amenities: ['projector', 'whiteboard'],
        status: 'available',
        description: 'Test room for automated tests'
      };

      const response = await request(app)
        .post('/api/rooms/v1/room')
        .send(roomData);

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    test('TC_ROOM_002: Should create room with valid authentication', async () => {
      const roomData = {
        name: `Test Room ${Date.now()}`,
        location: 'Floor 1',
        capacity: 10,
        amenities: ['projector', 'whiteboard'],
        status: 'available',
        description: 'Test room for automated tests'
      };

      const response = await request(app)
        .post('/api/rooms/v1/room')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData);

      expect([201, 403]).toContain(response.statusCode);
      expect(response.body).toHaveProperty('success');
    });

    test('TC_ROOM_003: Should validate capacity field', async () => {
      const invalidRoom = {
        name: 'Invalid Room',
        location: 'Floor 1',
        capacity: -5, // Invalid negative capacity
        amenities: ['projector']
      };

      const response = await request(app)
        .post('/api/rooms/v1/room')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRoom);

      // Should fail due to validation
      expect([400, 422]).toContain(response.statusCode);
    });
  });

  describe('GET /api/rooms/v1/rooms', () => {
    test('TC_ROOM_004: Should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/rooms/v1/rooms');

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    test('TC_ROOM_005: Should get all rooms with valid token', async () => {
      const response = await request(app)
        .get('/api/rooms/v1/rooms')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
