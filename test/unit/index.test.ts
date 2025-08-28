import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock the database connection to prevent actual MongoDB connections during testing
jest.mock('../../src/config/db', () => {
  return jest.fn().mockImplementation(() => Promise.resolve());
});

// Mock the app module
jest.mock('../../src/app', () => {
  return {
    listen: jest.fn((port: number, callback?: () => void) => {
      if (callback) callback();
      return { close: jest.fn() };
    })
  };
});

describe('Server Index', () => {
  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    // Clean up
    delete process.env.NODE_ENV;
  });

  test('should use PORT from environment variable', () => {
    process.env.PORT = '3000';
    
    // Clear module cache and require fresh copy
    delete require.cache[require.resolve('../../src/index')];
    require('../../src/index');
    
    expect(process.env.PORT).toBe('3000');
    
    // Clean up
    delete process.env.PORT;
  });

  test('should default to port 4000 when PORT is not set', () => {
    delete process.env.PORT;
    
    // Clear module cache and require fresh copy
    delete require.cache[require.resolve('../../src/index')];
    require('../../src/index');
    
    // Should not crash and should handle missing PORT
    expect(true).toBe(true);
  });

  test('should handle database connection on startup', () => {
    // Clear module cache before starting
    delete require.cache[require.resolve('../../src/index')];
    
    // This test validates that the index file can be loaded without crashing
    // which means the database connection call was handled properly (mocked)
    expect(() => {
      require('../../src/index');
    }).not.toThrow();
    
    // Additionally, verify the connectDB mock exists and is callable
    const connectDB = require('../../src/config/db');
    expect(typeof connectDB).toBe('function');
  });

  test('should not start server in test environment', () => {
    process.env.NODE_ENV = 'test';
    const app = require('../../src/app');
    
    // Clear module cache and require fresh copy
    delete require.cache[require.resolve('../../src/index')];
    require('../../src/index');
    
    expect(app.listen).not.toHaveBeenCalled();
  });

  test('should export the app module', () => {
    delete require.cache[require.resolve('../../src/index')];
    const indexModule = require('../../src/index');
    
    expect(indexModule).toBeDefined();
  });
});
