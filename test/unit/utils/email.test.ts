import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock nodemailer before importing the email service
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    verify: jest.fn(() => Promise.resolve()),
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' }))
  }))
}));

// Mock environment variables
const originalEnv = process.env;

describe('Email Utility', () => {
  beforeAll(() => {
    // Set up test environment variables
    process.env = {
      ...originalEnv,
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'test@example.com',
      SMTP_PASS: 'testpassword',
      SMTP_FROM: 'test@example.com',
      FRONTEND_URL: 'http://localhost:3000'
    };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should create email service successfully', () => {
    // Clear module cache to get fresh instance
    delete require.cache[require.resolve('../../../src/utils/email.util')];
    const { emailService } = require('../../../src/utils/email.util');
    
    expect(emailService).toBeDefined();
  });

  test('should send welcome email successfully', async () => {
    // Clear module cache to get fresh instance
    delete require.cache[require.resolve('../../../src/utils/email.util')];
    const { emailService } = require('../../../src/utils/email.util');
    
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'employee'
    };
    
    const temporaryPassword = 'TempPass123';

    // Should not throw an error
    await expect(emailService.sendWelcomeEmail(testUser, temporaryPassword)).resolves.not.toThrow();
  });

  test('should handle email sending failure', async () => {
    // Clear module cache and require fresh instance
    delete require.cache[require.resolve('../../../src/utils/email.util')];
    
    // Create a fresh instance for this test
    const { emailService } = require('../../../src/utils/email.util');
    
    // Mock the transporter's sendMail method to fail
    (emailService as any).transporter.sendMail = jest.fn(() => Promise.reject(new Error('SMTP Error')));
    
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'employee'
    };
    
    await expect(emailService.sendWelcomeEmail(testUser, 'password123'))
      .rejects.toThrow('Failed to send welcome email');
  });

  test('should validate SMTP configuration exists', () => {
    // This test validates that the service was created successfully
    // which means all required environment variables were present
    delete require.cache[require.resolve('../../../src/utils/email.util')];
    const { emailService } = require('../../../src/utils/email.util');
    
    expect(emailService).toBeDefined();
    expect((emailService as any).transporter).toBeDefined();
  });
});
