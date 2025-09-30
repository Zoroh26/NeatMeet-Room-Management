import mongoose = require('mongoose');
import { logger } from '../utils/logger';

const connectDB = async (url: string): Promise<void> => {
  try {
    const conn = await mongoose.connect(url);
    const message = `MongoDB connected: ${conn.connection.host}`;
    console.log(message);
    logger.info(message, { 
      host: conn.connection.host,
      database: conn.connection.name 
    });
  } catch (error) {
    const errorMsg = 'MongoDB connection error:';
    console.error(errorMsg, error);
    logger.error(errorMsg, { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
};

module.exports = connectDB;
