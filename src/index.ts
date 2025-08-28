const app = require('./app');
const connectDB = require('./config/db');
import { logger } from './utils/logger';

const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB(process.env.MongoDB_URL as string);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    const messages = [
      `NeatMeet server is running on port ${PORT}`,
      `API endpoints available at: http://localhost:${PORT}/api`,
      `Health check: http://localhost:${PORT}/health`
    ];
    
    messages.forEach(msg => {
      console.log(msg);
      logger.info(msg, { port: PORT, environment: process.env.NODE_ENV });
    });
  });
}

module.exports = app;
