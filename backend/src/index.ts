const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB(process.env.MongoDB_URL as string);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`NeatMeet server is running on port ${PORT}`);
    console.log(`API endpoints available at: http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
