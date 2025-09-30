import { 
    formatUserResponse, 
    formatUsersResponse, 
    cleanUserObject 
} from '../../src/utils/response.util';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';


describe('Response Util Unit Tests', () => {
    describe('formatUserResponse', () => {
        test('Should format user with _id field', () => {
            const user = {
                _id: '60f1b2b3b3b3b3b3b3b3b3b3',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'employee',
                designation: 'Developer',
                password: 'hashedpassword',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = formatUserResponse(user);

            expect(result).toEqual({
                id: '60f1b2b3b3b3b3b3b3b3b3b3',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'employee',
                designation: 'Developer'
            });
        });

        test('Should format user with id field', () => {
            const user = {
                id: 'user123',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'admin',
                designation: 'Manager',
                extraField: 'should not appear'
            };

            const result = formatUserResponse(user);

            expect(result).toEqual({
                id: 'user123',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'admin',
                designation: 'Manager'
            });
        });

        test('Should prefer _id over id when both are present', () => {
            const user = {
                _id: 'mongodb_id',
                id: 'regular_id',
                name: 'Test User',
                email: 'test@example.com',
                role: 'employee',
                designation: 'Tester'
            };

            const result = formatUserResponse(user);

            expect(result).not.toBeNull();
            expect(result!.id).toBe('mongodb_id');
        });

        test('Should handle user with missing optional fields', () => {
            const user = {
                _id: '60f1b2b3b3b3b3b3b3b3b3b3',
                name: 'Minimal User',
                email: 'minimal@example.com'
            };

            const result = formatUserResponse(user);

            expect(result).toEqual({
                id: '60f1b2b3b3b3b3b3b3b3b3b3',
                name: 'Minimal User',
                email: 'minimal@example.com',
                role: undefined,
                designation: undefined
            });
        });

        test('Should return null for null user', () => {
            const result = formatUserResponse(null);
            expect(result).toBeNull();
        });

        test('Should return null for undefined user', () => {
            const result = formatUserResponse(undefined);
            expect(result).toBeNull();
        });

        test('Should handle empty object', () => {
            const user = {};
            const result = formatUserResponse(user);

            expect(result).toEqual({
                id: undefined,
                name: undefined,
                email: undefined,
                role: undefined,
                designation: undefined
            });
        });
    });

    describe('formatUsersResponse', () => {
        test('Should format array of users', () => {
            const users = [
                {
                    _id: 'user1',
                    name: 'User One',
                    email: 'user1@example.com',
                    role: 'employee',
                    designation: 'Developer'
                },
                {
                    _id: 'user2',
                    name: 'User Two',
                    email: 'user2@example.com',
                    role: 'admin',
                    designation: 'Manager'
                }
            ];

            const result = formatUsersResponse(users);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'user1',
                name: 'User One',
                email: 'user1@example.com',
                role: 'employee',
                designation: 'Developer'
            });
            expect(result[1]).toEqual({
                id: 'user2',
                name: 'User Two',
                email: 'user2@example.com',
                role: 'admin',
                designation: 'Manager'
            });
        });

        test('Should handle empty array', () => {
            const result = formatUsersResponse([]);
            expect(result).toEqual([]);
        });

        test('Should return empty array for null input', () => {
            const result = formatUsersResponse(null as any);
            expect(result).toEqual([]);
        });

        test('Should return empty array for undefined input', () => {
            const result = formatUsersResponse(undefined as any);
            expect(result).toEqual([]);
        });

        test('Should return empty array for non-array input', () => {
            const result = formatUsersResponse('not an array' as any);
            expect(result).toEqual([]);
        });

        test('Should handle array with null users', () => {
            const users: any[] = [
                {
                    _id: 'user1',
                    name: 'Valid User',
                    email: 'valid@example.com',
                    role: 'employee',
                    designation: 'Developer'
                },
                null,
                {
                    _id: 'user2',
                    name: 'Another Valid User',
                    email: 'another@example.com',
                    role: 'admin',
                    designation: 'Manager'
                }
            ];

            const result = formatUsersResponse(users);

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
                id: 'user1',
                name: 'Valid User',
                email: 'valid@example.com',
                role: 'employee',
                designation: 'Developer'
            });
            expect(result[1]).toBeNull();
            expect(result[2]).toEqual({
                id: 'user2',
                name: 'Another Valid User',
                email: 'another@example.com',
                role: 'admin',
                designation: 'Manager'
            });
        });

        test('Should handle large array of users', () => {
            const users = Array.from({ length: 100 }, (_, index) => ({
                _id: `user${index}`,
                name: `User ${index}`,
                email: `user${index}@example.com`,
                role: index % 2 === 0 ? 'employee' : 'admin',
                designation: index % 2 === 0 ? 'Developer' : 'Manager'
            }));

            const result = formatUsersResponse(users);

            expect(result).toHaveLength(100);
            expect(result[0]).toEqual({
                id: 'user0',
                name: 'User 0',
                email: 'user0@example.com',
                role: 'employee',
                designation: 'Developer'
            });
            expect(result[99]).toEqual({
                id: 'user99',
                name: 'User 99',
                email: 'user99@example.com',
                role: 'admin',
                designation: 'Manager'
            });
        });
    });

    describe('cleanUserObject', () => {
        test('Should clean user object and map _id to id', () => {
            const userObject = {
                _id: '60f1b2b3b3b3b3b3b3b3b3b3',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'employee',
                designation: 'Developer',
                password: 'hashedpassword',
                createdAt: new Date(),
                updatedAt: new Date(),
                __v: 0,
                extraField: 'unwanted'
            };

            const result = cleanUserObject(userObject);

            expect(result).toEqual({
                id: '60f1b2b3b3b3b3b3b3b3b3b3',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'employee',
                designation: 'Developer'
            });
        });

        test('Should handle user object with missing fields', () => {
            const userObject = {
                _id: 'user123',
                name: 'Incomplete User'
            };

            const result = cleanUserObject(userObject);

            expect(result).toEqual({
                id: 'user123',
                name: 'Incomplete User',
                email: undefined,
                role: undefined,
                designation: undefined
            });
        });

        test('Should return null for null input', () => {
            const result = cleanUserObject(null);
            expect(result).toBeNull();
        });

        test('Should return null for undefined input', () => {
            const result = cleanUserObject(undefined);
            expect(result).toBeNull();
        });

        test('Should handle empty object', () => {
            const userObject = {};
            const result = cleanUserObject(userObject);

            expect(result).toEqual({
                id: undefined,
                name: undefined,
                email: undefined,
                role: undefined,
                designation: undefined
            });
        });

        test('Should properly destructure and exclude unwanted fields', () => {
            const userObject = {
                _id: 'user456',
                name: 'Test User',
                email: 'test@example.com',
                role: 'admin',
                designation: 'CTO',
                password: 'secret',
                isDeleted: false,
                deletedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                __v: 1,
                randomField: 'should not appear'
            };

            const result = cleanUserObject(userObject);

            // Should only include the expected fields
            expect(Object.keys(result!)).toEqual(['id', 'name', 'email', 'role', 'designation']);
            
            // Should not include any unwanted fields
            expect(result).not.toHaveProperty('password');
            expect(result).not.toHaveProperty('isDeleted');
            expect(result).not.toHaveProperty('deletedAt');
            expect(result).not.toHaveProperty('createdAt');
            expect(result).not.toHaveProperty('updatedAt');
            expect(result).not.toHaveProperty('__v');
            expect(result).not.toHaveProperty('randomField');
        });
    });

    describe('Integration Tests', () => {
        test('All functions should work together seamlessly', () => {
            const rawUserObject = {
                _id: '60f1b2b3b3b3b3b3b3b3b3b3',
                name: 'Integration User',
                email: 'integration@example.com',
                role: 'employee',
                designation: 'Full Stack Developer',
                password: 'hashedpassword',
                createdAt: new Date(),
                updatedAt: new Date(),
                __v: 0
            };

            // Test cleanUserObject
            const cleanedUser = cleanUserObject(rawUserObject);
            expect(cleanedUser).toBeDefined();
            expect(cleanedUser!.id).toBe('60f1b2b3b3b3b3b3b3b3b3b3');

            // Test formatUserResponse with cleaned object
            const formattedUser = formatUserResponse(cleanedUser);
            expect(formattedUser).toEqual(cleanedUser);

            // Test formatUsersResponse with array containing the user
            const usersArray = [rawUserObject];
            const formattedUsers = formatUsersResponse(usersArray);
            expect(formattedUsers).toHaveLength(1);
            expect(formattedUsers[0]?.id).toBe('60f1b2b3b3b3b3b3b3b3b3b3');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('Should handle circular references gracefully', () => {
            const userObject: any = {
                _id: 'circular_user',
                name: 'Circular User',
                email: 'circular@example.com',
                role: 'employee',
                designation: 'Developer'
            };
            
            // Create circular reference
            userObject.self = userObject;

            // Functions should still work despite circular reference
            expect(() => formatUserResponse(userObject)).not.toThrow();
            expect(() => cleanUserObject(userObject)).not.toThrow();
        });

        test('Should handle very long strings', () => {
            const longString = 'a'.repeat(10000);
            const userObject = {
                _id: 'long_string_user',
                name: longString,
                email: `${longString}@example.com`,
                role: 'employee',
                designation: longString
            };

            const result = formatUserResponse(userObject);
            expect(result!.name).toBe(longString);
            expect(result!.email).toBe(`${longString}@example.com`);
            expect(result!.designation).toBe(longString);
        });

        test('Should handle special characters and unicode', () => {
            const userObject = {
                _id: 'unicode_user',
                name: '测试用户 🚀',
                email: 'tëst@exämple.com',
                role: 'ëmployee',
                designation: 'Développeur'
            };

            const result = formatUserResponse(userObject);
            expect(result!.name).toBe('测试用户 🚀');
            expect(result!.email).toBe('tëst@exämple.com');
            expect(result!.role).toBe('ëmployee');
            expect(result!.designation).toBe('Développeur');
        });
    });
});
