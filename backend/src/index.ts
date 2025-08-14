import express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./api');
const cookieParser = require('cookie-parser');

dotenv.config();


const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Connect to MongoDB
connectDB(process.env.MongoDB_URL as string);

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'NeatMeet Server is running', 
    timestamp: new Date().toISOString() 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`NeatMeet server is running on port ${PORT}`);
  console.log(`API endpoints available at: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
