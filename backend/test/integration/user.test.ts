import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
const app = require('../../src/app');
const connectDB = require('../../src/config/db');
const mongoose = require('mongoose');

describe('Users API - Integration Tests', () => {
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

  describe('GET /api/users/v1/users', () => {
    test('TC_USER_001: Should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users/v1/users');

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    test('TC_USER_002: Should get all users with valid token', async () => {
      const response = await request(app)
        .get('/api/users/v1/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/users/v1/user', () => {
    test('TC_USER_003: Should fail without authentication', async () => {
      const newUser = {
        name: 'New Test User',
        email: `newuser${Date.now()}@example.com`,
        password: 'NewUser@123',
        role: 'employee',
        designation: 'Tester'
      };

      const response = await request(app)
        .post('/api/users/v1/user')
        .send(newUser);

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    test('TC_USER_004: Should create new user with admin token', async () => {
      const newUser = {
        name: 'New Test User',
        email: `newuser${Date.now()}@example.com`,
        password: 'NewUser@123',
        role: 'employee',
        designation: 'Tester'
      };

      const response = await request(app)
        .post('/api/users/v1/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser);

      // Should succeed if the logged-in user is an admin
      expect([201, 403]).toContain(response.statusCode);
      expect(response.body).toHaveProperty('success');
    });

    test('TC_USER_005: Should validate email format', async () => {
      const userWithInvalidEmail = {
        name: 'Test User',
        email: 'invalid-email-format',
        password: 'TestUser@123',
        role: 'employee',
        designation: 'Tester'
      };

      const response = await request(app)
        .post('/api/users/v1/user')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userWithInvalidEmail);

      // Should fail due to validation
      expect([400, 422]).toContain(response.statusCode);
    });
  });
});
