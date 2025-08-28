import { Request, Response, NextFunction } from 'express';
import { requirePasswordChange, allowPasswordChangeRoutes } from '../../src/middlewares/password-change.middleware';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock the user model
jest.mock('../../src/models/user.model', () => ({
    findById: jest.fn()
}));

const User = require('../../src/models/user.model');

describe('Password Change Middleware Tests', () => {
    let mockRequest: any;
    let mockResponse: any;
    let mockNext: NextFunction;
    let responseObject: any;

    beforeEach(() => {
        jest.clearAllMocks();
        
        responseObject = {};
        
        mockRequest = {
            user: { userId: 'test-user-id' },
            path: '/api/v1/some-route'
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockImplementation((data: any) => {
                responseObject = data;
                return mockResponse;
            })
        };

        mockNext = jest.fn();
    });

    describe('requirePasswordChange', () => {
        test('Should call next when user does not require password change', async () => {
            const mockUserData = {
                _id: 'test-user-id',
                isInitialPassword: false
            };
            
            User.findById.mockResolvedValue(mockUserData);

            await requirePasswordChange(mockRequest as Request, mockResponse as Response, mockNext);

            expect(User.findById).toHaveBeenCalledWith('test-user-id');
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        test('Should return 403 when user requires password change', async () => {
            const mockUserData = {
                _id: 'test-user-id',
                isInitialPassword: true
            };
            
            User.findById.mockResolvedValue(mockUserData);

            await requirePasswordChange(mockRequest as Request, mockResponse as Response, mockNext);

            expect(User.findById).toHaveBeenCalledWith('test-user-id');
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(responseObject).toEqual({
                success: false,
                message: 'Password change required. Please change your password before accessing this resource.',
                requiresPasswordChange: true
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('Should return 401 when no userId in request', async () => {
            mockRequest.user = undefined;

            await requirePasswordChange(mockRequest as Request, mockResponse as Response, mockNext);

            expect(User.findById).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(responseObject).toEqual({
                success: false,
                message: 'Authentication required'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('Should return 404 when user not found', async () => {
            User.findById.mockResolvedValue(null);

            await requirePasswordChange(mockRequest as Request, mockResponse as Response, mockNext);

            expect(User.findById).toHaveBeenCalledWith('test-user-id');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(responseObject).toEqual({
                success: false,
                message: 'User not found'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('Should handle database errors', async () => {
            const dbError = new Error('Database connection failed');
            User.findById.mockRejectedValue(dbError);

            await requirePasswordChange(mockRequest as Request, mockResponse as Response, mockNext);

            expect(User.findById).toHaveBeenCalledWith('test-user-id');
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(responseObject).toEqual({
                success: false,
                message: 'Error checking password change requirement'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('allowPasswordChangeRoutes', () => {
        test('Should allow access to change-password route', () => {
            mockRequest.path = '/api/v1/auth/change-password';

            allowPasswordChangeRoutes(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        test('Should allow access to me route', () => {
            mockRequest.path = '/api/v1/auth/me';

            allowPasswordChangeRoutes(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        test('Should allow access to logout route', () => {
            mockRequest.path = '/api/v1/auth/logout';

            allowPasswordChangeRoutes(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        test('Should call requirePasswordChange for non-allowed routes', async () => {
            const mockUserData = {
                _id: 'test-user-id',
                isInitialPassword: false
            };
            
            User.findById.mockResolvedValue(mockUserData);
            mockRequest.path = '/api/v1/bookings';

            await allowPasswordChangeRoutes(mockRequest as Request, mockResponse as Response, mockNext);

            expect(User.findById).toHaveBeenCalledWith('test-user-id');
            expect(mockNext).toHaveBeenCalled();
        });

        test('Should block non-allowed routes when password change required', async () => {
            const mockUserData = {
                _id: 'test-user-id',
                isInitialPassword: true
            };
            
            User.findById.mockResolvedValue(mockUserData);
            mockRequest.path = '/api/v1/bookings';

            await allowPasswordChangeRoutes(mockRequest as Request, mockResponse as Response, mockNext);

            expect(User.findById).toHaveBeenCalledWith('test-user-id');
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(responseObject).toEqual({
                success: false,
                message: 'Password change required. Please change your password before accessing this resource.',
                requiresPasswordChange: true
            });
        });
    });
});
