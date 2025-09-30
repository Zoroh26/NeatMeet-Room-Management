// Set NODE_ENV to test for faster bcrypt operations
process.env.NODE_ENV = 'test';

// Set other test environment variables if needed
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key';
}

if (!process.env.JWT_EXPIRE) {
  process.env.JWT_EXPIRE = '1d';
}
