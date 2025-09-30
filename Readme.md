# 🏢 NeatMeet - Meeting Room Management System

[![Node.js](https://img.shields.io/badge/Node.js-22.14+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21+-lightgrey.svg)](https://expressjs.com/)
[![Jest](https://img.shields.io/badge/Jest-30.0+-red.svg)](https://jestjs.io/)
[![Winston](https://img.shields.io/badge/Winston-3.17+-blue.svg)](https://github.com/winstonjs/winston)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

A comprehensive meeting room booking and management system built with modern web technologies. NeatMeet streamlines the process of reserving meeting rooms, managing user access, and maintaining organizational efficiency with enterprise-grade features.

## 🚀 Features

### 🔐 Authentication & Authorization
- **Secure JWT-based authentication** with httpOnly cookies
- **Role-based access control** (Admin, Employee)
- **Password security** with bcrypt hashing (12 salt rounds)
- **Forced password change** on first login for new users
- **Admin password reset** functionality
- **Email notifications** for new user credentials
- **Token validation middleware** with comprehensive error handling

### 📅 Meeting Room Booking
- **Real-time room availability** tracking
- **Booking conflict prevention** with unique constraints
- **Comprehensive booking management** (create, update, cancel)
- **Booking history** and user activity tracking
- **Room utilization** analytics and reporting
- **Status management** (pending, confirmed, cancelled)

### 🏠 Room Management
- **Complete CRUD operations** for meeting rooms
- **Room availability tracking** and status management
- **Soft delete functionality** with restore capabilities
- **Room filtering** by availability and status
- **Comprehensive room information** (capacity, amenities, location)
- **Room maintenance** and scheduling capabilities

### 👥 User Management
- **Admin-controlled user registration** with email notifications
- **User profile management** and role assignment
- **Soft delete users** with restoration capabilities
- **User activity tracking** and audit trails
- **Designation-based organization** structure

### 🛡️ Security & Middleware
- **Centralized error handling** with Winston logging
- **Input validation** with comprehensive validation middleware
- **CORS protection** and security headers
- **Environment-based configuration** for security
- **Protected routes** with authentication middleware
- **Password change enforcement** middleware
- **Request logging** and monitoring

### 📧 Email Integration
- **Gmail SMTP integration** for user notifications
- **Welcome emails** with temporary credentials
- **Password reset notifications**
- **Configurable email templates**
- **Email delivery tracking**

### 🔍 Logging & Monitoring
- **Structured logging** with Winston
- **File rotation** and log management
- **Error tracking** and debugging
- **Request/response logging**
- **Performance monitoring**

### 🧪 Testing Suite
- **Unit tests** with Jest framework
- **Model testing** with MongoDB Memory Server
- **Controller testing** with mocking
- **Middleware testing** for authentication/authorization
- **Utility function testing**
- **Test coverage reporting**

## 🏗️ Architecture

### Backend Structure
```
backend/
├── src/
│   ├── api/                   # API modules with versioning
│   │   ├── auth/v1/           # Authentication endpoints
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.services.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   ├── booking/v1/        # Booking management endpoints
│   │   │   ├── booking.controller.ts
│   │   │   ├── booking.service.ts
│   │   │   ├── booking.route.ts
│   │   │   └── booking.validation.ts
│   │   ├── room/v1/           # Room management endpoints
│   │   │   ├── room.controller.ts
│   │   │   ├── room.service.ts
│   │   │   ├── room.routes.ts
│   │   │   └── room.validation.ts
│   │   ├── user/v1/           # User management endpoints
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.route.ts
│   │   │   └── user.validation.ts
│   │   └── index.ts           # API routes aggregator
│   ├── config/                # Configuration files
│   │   ├── db.ts              # MongoDB connection with logging
│   │   └── config.ts          # Application configuration
│   ├── middlewares/           # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   └── password-change.middleware.ts
│   ├── models/                # Mongoose models
│   │   ├── user.model.ts      # User schema with validation
│   │   ├── room.model.ts      # Room schema
│   │   └── booking.model.ts   # Booking schema with constraints
│   ├── utils/                 # Utility functions
│   │   ├── logger.ts          # Winston logging configuration
│   │   ├── email.util.ts      # Email service utilities
│   │   ├── response.util.ts   # Response formatting utilities
│   ├── app.ts                 # Express app configuration
│   └── index.ts               # Server entry point
├── test/                      # Test suite
│   ├── unit/                  # Unit tests
│   │   ├── booking.model.test.ts
│   │   ├── user.model.test.ts
│   │   ├── response.util.test.ts
│   │   └── password-change.middleware.test.ts
│   └── integration/           # Integration tests
├── logs/                      # Log files
│   ├── error.log
│   └── combined.log
├── coverage/                  # Test coverage reports
├── package.json
├── tsconfig.json
├── jest.config.js
└── .env                       # Environment variables
```

### Technology Stack

#### Backend
- **Runtime:** Node.js 22.14+
- **Framework:** Express.js 4.21+
- **Language:** TypeScript 5.9+
- **Database:** MongoDB with Mongoose ODM 7.8+
- **Authentication:** JWT 9.0+ with bcrypt 6.0+ password hashing
- **Validation:** Custom validation middleware
- **Email:** Nodemailer 7.0+ with Gmail SMTP
- **Logging:** Winston 3.17+ with structured logging
- **Testing:** Jest 30.0+ with MongoDB Memory Server 10.2+
- **Development:** tsx 4.20+ for TypeScript execution, nodemon 3.0+ for hot reload

#### Security & Middleware
- **CORS:** Cross-origin resource sharing
- **Cookie Parser:** Secure cookie handling
- **Input Validation:** Comprehensive request validation
- **Error Handling:** Centralized error management with logging
- **Authentication:** JWT token validation middleware
- **Authorization:** Role-based access control

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 22.14.0 or higher
- npm 10.9+ or yarn package manager
- MongoDB 7.0 or higher (Atlas Cloud recommended)
- Gmail account for SMTP (optional but recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/Zoroh26/NeatMeet.git
cd NeatMeet
```

### 2. Backend Setup
```bash
cd backend
npm install
```

**Key Dependencies:**
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "express": "^4.21.2",
    "mongoose": "^7.8.7",
    "jsonwebtoken": "^9.0.2",
    "winston": "^3.17.0",
    "nodemailer": "^7.0.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.9.2",
    "jest": "^30.0.5",
    "@types/node": "^24.2.0",
    "tsx": "^4.20.3",
    "nodemon": "^3.0.1"
  }
}
```

### Version Compatibility

| Component | Version | Status | Notes |
|-----------|---------|--------|-------|
| Node.js | 22.14.0+ | ✅ Latest LTS | Recommended for production |
| npm | 10.9.2+ | ✅ Latest | Package manager |
| TypeScript | 5.9.2+ | ✅ Latest | Type safety and modern features |
| Express.js | 4.21.2+ | ✅ Latest | Web framework |
| MongoDB | 7.0+ | ✅ Latest | Database (Atlas Cloud) |
| Mongoose | 7.8.7+ | ✅ Latest | ODM for MongoDB |
| Jest | 30.0+ | ✅ Latest | Testing framework |
| Winston | 3.17+ | ✅ Latest | Logging framework |

### 3. Environment Configuration
Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
MongoDB_URL=mongodb://localhost:27017/neatmeet
# Or for MongoDB Atlas:
# MongoDB_URL=mongodb+srv://username:password@cluster.mongodb.net/neatmeet

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

### 4. Gmail SMTP Setup (Optional)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `SMTP_PASS`

### 5. Start the Application
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

The server will start on `http://localhost:4000`

## 📡 API Documentation

### Base URL
```
http://localhost:4000/api/v1
```

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "_id": "user_id",
            "name": "John Doe",
            "email": "user@example.com",
            "role": "employee",
            "designation": "Developer"
        },
        "token": "jwt_token_here",
        "requiresPasswordChange": false
    }
}
```

#### Register User (Admin Only)
```http
POST /auth/register
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "TempPassword123!",
    "role": "employee",
    "designation": "Designer"
}
```

#### Change Password
```http
PUT /auth/change-password
Authorization: Bearer <user_token>
Content-Type: application/json

{
    "currentPassword": "oldPassword123",
    "newPassword": "NewPassword123!"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <user_token>
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <user_token>
```

#### Reset User Password (Admin Only)
```http
PUT /auth/reset-password/:userId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "newPassword": "NewTempPassword123!"
}
```

### Booking Management Endpoints

#### Get All Bookings
```http
GET /bookings
Authorization: Bearer <user_token>
```

#### Get User's Bookings
```http
GET /bookings/my-bookings
Authorization: Bearer <user_token>
```

#### Create Booking
```http
POST /bookings
Authorization: Bearer <user_token>
Content-Type: application/json

{
    "room_id": "room_object_id",
    "date": "2025-08-22",
    "start_time": "09:00",
    "end_time": "10:00",
    "purpose": "Team standup meeting"
}
```

#### Update Booking
```http
PUT /bookings/:id
Authorization: Bearer <user_token>
Content-Type: application/json

{
    "date": "2025-08-23",
    "start_time": "10:00",
    "end_time": "11:00",
    "purpose": "Updated meeting purpose"
}
```

#### Cancel Booking
```http
PATCH /bookings/:id/cancel
Authorization: Bearer <user_token>
```

#### Get Room Availability
```http
GET /bookings/availability/:roomId?date=2025-08-22
Authorization: Bearer <user_token>
```

#### Admin: Get All Bookings
```http
GET /bookings/all
Authorization: Bearer <admin_token>
```

### User Management Endpoints

#### Get All Users (Admin Only)
```http
GET /users
Authorization: Bearer <admin_token>
```

#### Get User by ID (Admin Only)
```http
GET /users/:id
Authorization: Bearer <admin_token>
```

#### Create User (Admin Only)
```http
POST /users/user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "TempPassword123!",
    "role": "employee",
    "designation": "Software Developer"
}
```

#### Update User Profile
```http
PUT /users/:id
Authorization: Bearer <user_token>
Content-Type: application/json

{
    "name": "Updated Name",
    "designation": "Senior Developer"
}
```

#### Delete User (Admin Only)
```http
PATCH /users/:id
Authorization: Bearer <admin_token>
```

#### Get Deleted Users (Admin Only)
```http
GET /users/deleted
Authorization: Bearer <admin_token>
```

### Room Management Endpoints

#### Get All Rooms
```http
GET /rooms
Authorization: Bearer <user_token>
```

#### Get Room by ID
```http
GET /rooms/:id
Authorization: Bearer <user_token>
```

#### Create Room (Admin Only)
```http
POST /rooms
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "name": "Conference Room A",
    "capacity": 10,
    "location": "Building 1, Floor 2",
    "amenities": ["Projector", "Whiteboard", "Video Conferencing"],
    "description": "Large conference room with modern amenities"
}
```

#### Update Room
```http
PUT /rooms/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "name": "Updated Room Name",
    "capacity": 12,
    "status": "available"
}
```

#### Delete Room (Soft Delete)
```http
DELETE /rooms/:id
Authorization: Bearer <admin_token>
```

#### Get Available Rooms
```http
GET /rooms/available
Authorization: Bearer <user_token>
```

#### Get Deleted Rooms
```http
GET /rooms/deleted
Authorization: Bearer <admin_token>
```

#### Restore Deleted Room
```http
PUT /rooms/:id/restore
Authorization: Bearer <admin_token>
```

### Response Format
All API responses follow this structure:
```json
{
    "success": boolean,
    "message": "string",
    "data": object | array,
    "errors": array (only on validation failures)
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🔒 Security Features

### Password Security
- **Bcrypt hashing** with 12 salt rounds
- **Password complexity requirements**
- **Forced password change** on first login
- **Secure password reset** by administrators

### JWT Security
- **HttpOnly cookies** for token storage
- **24-hour token expiration**
- **Secure token verification** middleware

### Input Validation
- **Email format validation**
- **Password strength requirements**
- **Request sanitization**
- **SQL injection protection**

### Access Control
- **Role-based permissions** (Admin vs Employee)
- **Protected route middleware**
- **Password change enforcement**

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- user.model.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Test Structure
```
test/
├── unit/                      # Unit tests
│   ├── booking.model.test.ts  # Booking model tests
│   ├── user.model.test.ts     # User model tests
│   ├── response.util.test.ts  # Response utility tests
│   └── password-change.middleware.test.ts
└── integration/               # Integration tests (coming soon)
```

### Test Coverage
The project maintains comprehensive test coverage for:
- **Model validation** and constraints
- **Password hashing** and comparison
- **Utility functions** and response formatting
- **Middleware functionality**
- **Error handling** scenarios

### Manual Testing with Postman

1. **Create Admin User** (one-time setup):
```javascript
// Run this script in MongoDB shell or create via database client
db.users.insertOne({
    name: 'Admin User',
    email: 'admin@neatmeet.com',
    password: '$2b$12$hash_of_admin123',  // bcrypt hash of 'admin123'
    role: 'admin',
    designation: 'System Administrator',
    isInitialPassword: false,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
});
```

2. **Test Authentication Flow**:
   - Login as admin → Get JWT token
   - Register new user → User receives email
   - Login with new user → Requires password change
   - Change password → Normal access granted
   - Access protected routes → Verify authorization

3. **Test Booking Flow**:
   - Create room → Admin creates meeting room
   - Book room → User creates booking
   - Check conflicts → Verify unique constraints
   - Update booking → Modify existing booking
   - Cancel booking → Change status to cancelled

### Environment Testing
- **Development:** `npm run dev` with hot reload
- **Production Build:** `npm run build && npm start`
- **Test Environment:** Uses MongoDB Memory Server

## 🚀 Deployment

### Production Checklist
- [ ] Set strong `JWT_SECRET` (minimum 64 characters)
- [ ] Configure production MongoDB URL (Atlas recommended)
- [ ] Set up email service with proper SMTP credentials
- [ ] Configure CORS for frontend domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up process manager (PM2 recommended)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up log rotation and monitoring
- [ ] Configure backup strategy for MongoDB
- [ ] Set up monitoring and alerting

### Environment Variables for Production
```env
NODE_ENV=production
PORT=4000

# Database
MongoDB_URL=mongodb+srv://user:pass@cluster.mongodb.net/neatmeet

# Security
JWT_SECRET=your-super-secure-64-character-production-jwt-secret-key-here
JWT_EXPIRES_IN=24h

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourcompany.com
SMTP_PASS=your-app-specific-password
SMTP_FROM="NeatMeet System" <noreply@yourcompany.com>

# Application
FRONTEND_URL=https://neatmeet.yourcompany.com
LOG_LEVEL=info

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Deployment (Optional)
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4000
USER node
CMD ["node", "dist/index.js"]
```

**Docker Compose (with MongoDB):**
```yaml
version: '3.8'
services:
  neatmeet-api:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - MongoDB_URL=mongodb://mongo:27017/neatmeet
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

### PM2 Configuration
```json
{
  "apps": [{
    "name": "neatmeet-api",
    "script": "dist/index.js",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production",
      "PORT": 4000
    },
    "log_file": "logs/combined.log",
    "error_file": "logs/error.log",
    "out_file": "logs/out.log"
  }]
}
```

## 📊 Logging & Monitoring

### Winston Logger Configuration
- **Structured logging** with JSON format
- **Log levels:** error, warn, info, debug
- **File rotation:** 5MB max size, 5 files retained
- **Console output** in development
- **Error tracking** with stack traces

### Log Files Location
```
logs/
├── error.log      # Error level logs only
└── combined.log   # All log levels
```

### Monitoring Endpoints
- **Health Check:** `GET /health`
- **API Status:** All endpoints return structured responses
- **Error Tracking:** Centralized error handler with logging

### Sample Log Output
```json
{
  "timestamp": "2025-08-22 10:30:45",
  "level": "info",
  "message": "Login successful",
  "service": "neatmeet-api",
  "email": "user@example.com",
  "userId": "64f7b1a2c3d4e5f6g7h8i9j0",
  "ip": "192.168.1.100"
}
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow coding standards:**
   - Use TypeScript strict mode
   - Add comprehensive error handling
   - Include input validation
   - Write unit tests for new features
   - Update documentation
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Development Guidelines
- **Code Style:** Follow TypeScript best practices
- **Testing:** Maintain test coverage above 80%
- **Documentation:** Update README for new features
- **Security:** Validate all inputs and handle errors
- **Logging:** Add appropriate logging for debugging
- **Performance:** Consider MongoDB query optimization

### Code Review Checklist
- [ ] TypeScript compilation without errors
- [ ] All tests passing
- [ ] Security vulnerabilities addressed
- [ ] Proper error handling implemented
- [ ] API documentation updated
- [ ] Environment variables documented

## 📈 Performance Considerations

### Database Optimization
- **Indexes** on frequently queried fields
- **Compound indexes** for booking uniqueness
- **Aggregation pipelines** for complex queries
- **Connection pooling** with Mongoose

### API Performance
- **Input validation** at middleware level
- **Response formatting** utilities
- **Error handling** without exposing sensitive data
- **Request logging** for monitoring

### Security Best Practices
- **JWT token expiration** (24 hours)
- **Password hashing** with bcrypt (12 rounds)
- **Input sanitization** and validation
- **Role-based authorization**
- **CORS configuration** for frontend domains

### Dependency Management

#### Check for Updates
```bash
# Check outdated packages
npm outdated

# Update all dependencies to latest
npm update

# Update specific package
npm install package-name@latest

# Security audit and fix
npm audit
npm audit fix
```

#### Version Pinning Strategy
- **Major versions** are pinned for stability
- **Minor/patch updates** are allowed (^)
- **Security updates** should be applied immediately
- **Breaking changes** require careful testing

#### Regular Maintenance
```bash
# Monthly dependency check
npm outdated
npm audit

# Update dev dependencies
npm update --dev

# Clean install (removes node_modules)
rm -rf node_modules package-lock.json
npm install
```

## 🔧 Troubleshooting

### Common Issues

#### MongoDB Connection
```bash
# Check connection string
echo $MongoDB_URL

# Test connection
npm run dev
# Look for: "MongoDB connected: cluster.mongodb.net"
```

#### Email Service
```bash
# Check SMTP configuration
npm run dev
# Check logs for SMTP connection status
```

#### JWT Token Issues
```bash
# Verify JWT secret length (minimum 32 characters)
echo $JWT_SECRET | wc -c

# Check token in browser cookies/localStorage
```

#### Permission Errors
- Ensure user has correct role (admin vs employee)
- Check JWT token validity and expiration
- Verify middleware order in routes

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Check specific log files
tail -f logs/error.log
tail -f logs/combined.log
```

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Rohith**
- GitHub: [@Zoroh26](https://github.com/Zoroh26)
- LinkedIn: [Connect with Rohith](https://linkedin.com/in/rohith26p)
- Email: rohith26p@gmail.com

## 🙏 Acknowledgments

- **Express.js team** for the robust web framework
- **MongoDB team** for the excellent database solution
- **JWT.io** for authentication standards
- **Nodemailer team** for email integration
- **TypeScript team** for type safety
- **Winston team** for structured logging
- **Jest team** for comprehensive testing framework

## 📞 Support & Contact

### Technical Support
- 📧 **Email:** rohith26p@gmail.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/Zoroh26/NeatMeet/issues)
- 📖 **Documentation:** [Project Wiki](https://github.com/Zoroh26/NeatMeet/wiki)

### Community
- 💬 **Discussions:** [GitHub Discussions](https://github.com/Zoroh26/NeatMeet/discussions)
- ⭐ **Star the repo** if you find it useful!
- 🍴 **Fork and contribute** to make it better

---

**Made with ❤️ for efficient meeting room management**

*NeatMeet - Streamlining workplace collaboration one booking at a time* 🚀