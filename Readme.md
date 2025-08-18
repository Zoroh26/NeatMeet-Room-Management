# 🏢 NeatMeet - Meeting Room Management System

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-lightgrey.svg)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

A comprehensive meeting room booking and management system built with modern web technologies. NeatMeet streamlines the process of reserving meeting rooms, managing user access, and maintaining organizational efficiency.

## 🚀 Features

### 🔐 Authentication & Authorization
- **Secure JWT-based authentication** with httpOnly cookies
- **Role-based access control** (Admin, Employee)
- **Password security** with bcrypt hashing (12 salt rounds)
- **Forced password change** on first login for new users
- **Admin password reset** functionality
- **Email notifications** for new user credentials

### 🏠 Room Management
- **Complete CRUD operations** for meeting rooms
- **Room availability tracking** and status management
- **Soft delete functionality** with restore capabilities
- **Room filtering** by availability and status
- **Comprehensive room information** (capacity, amenities, location)

### 👥 User Management
- **Admin-controlled user registration** with email notifications
- **User profile management** and role assignment
- **Soft delete users** with restoration capabilities
- **User activity tracking** and audit trails

### 🛡️ Security Features
- **Input validation** with express-validator
- **CORS protection** and security headers
- **Environment-based configuration** for security
- **Protected routes** with middleware authentication
- **Error handling** with proper HTTP status codes

### 📧 Email Integration
- **Gmail SMTP integration** for user notifications
- **Welcome emails** with temporary credentials
- **Password reset notifications**
- **Configurable email templates**

## 🏗️ Architecture

### Backend Structure
```
backend/
├── src/
│   ├── api/
│   │   ├── auth/v1/           # Authentication endpoints
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.services.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   └── room/v1/           # Room management endpoints
│   │       ├── room.controller.ts
│   │       ├── room.service.ts
│   │       ├── room.routes.ts
│   │       └── room.validation.ts
│   ├── config/
│   │   └── db.ts              # MongoDB connection
│   ├── middlwares/
│   │   ├── auth.middleware.ts
│   │   └── password-change.middleware.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   └── room.model.ts
│   ├── utils/
│   │   └── email.util.ts
│   └── index.ts               # Server entry point
├── package.json
└── tsconfig.json
```

### Technology Stack

#### Backend
- **Runtime:** Node.js 16+
- **Framework:** Express.js 4.18+
- **Language:** TypeScript 4.9+
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT with bcrypt password hashing
- **Validation:** express-validator
- **Email:** Nodemailer with Gmail SMTP
- **Development:** tsx for TypeScript execution, nodemon for hot reload

#### Security & Middleware
- **CORS:** Cross-origin resource sharing
- **Cookie Parser:** Secure cookie handling
- **Input Validation:** Comprehensive request validation
- **Error Handling:** Centralized error management

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16.0 or higher
- MongoDB 6.0 or higher
- npm or yarn package manager
- Gmail account for SMTP (optional)

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

### Manual Testing with Postman

1. **Create Admin User** (one-time setup):
```javascript
// Run this script to create initial admin
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdmin() {
    await mongoose.connect(process.env.MongoDB_URL);
    
    const User = mongoose.model('User', userSchema);
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = new User({
        name: 'Admin User',
        email: 'admin@neatmeet.com',
        password: hashedPassword,
        role: 'admin',
        designation: 'System Administrator',
        isInitialPassword: false
    });
    
    await admin.save();
    console.log('✅ Admin created: admin@neatmeet.com / admin123');
}
```

2. **Test Authentication Flow**:
   - Login as admin
   - Register new user
   - Login with new user (requires password change)
   - Change password
   - Access protected routes

### Environment Testing
- **Development:** `npm run dev`
- **Production Build:** `npm run build && npm start`

## 🚀 Deployment

### Production Checklist
- [ ] Set strong `JWT_SECRET`
- [ ] Configure production MongoDB URL
- [ ] Set up email service (Gmail SMTP)
- [ ] Configure CORS for frontend domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Set up process manager (PM2)
- [ ] Configure reverse proxy (Nginx)

### Environment Variables for Production
```env
NODE_ENV=production
PORT=4000
MongoDB_URL=mongodb+srv://user:pass@cluster.mongodb.net/neatmeet
JWT_SECRET=super-secure-production-secret
SMTP_HOST=smtp.gmail.com
SMTP_USER=production-email@company.com
SMTP_PASS=app-specific-password
FRONTEND_URL=https://neatmeet.company.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add input validation for all endpoints
- Include error handling
- Write descriptive commit messages
- Test thoroughly before submitting

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Rohith**
- GitHub: [@Zoroh26](https://github.com/Zoroh26)
- Email: rohit@example.com

## 🙏 Acknowledgments

- Express.js team for the robust web framework
- MongoDB team for the excellent database solution
- JWT.io for authentication standards
- Nodemailer team for email integration
- TypeScript team for type safety

## 📞 Support

For support, email rohit@example.com or create an issue in the GitHub repository.

---

**Made with ❤️ for efficient meeting room management**