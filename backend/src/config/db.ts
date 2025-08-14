import mongoose = require('mongoose');

const connectDB = async (url: string): Promise<void> => {
  try {
    const conn = await mongoose.connect(url);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
