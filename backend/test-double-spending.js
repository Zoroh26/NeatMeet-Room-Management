
const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/v1';
const testConfig = {
    email: 'rohith@yopmail.com',
    password: 'Rohith@123',
    concurrentRequests: 10
};

let authToken = '';
let roomId = '';
let userId = '';

async function setup() {
    console.log('Setting up test environment...');
    
    try {
        console.log('Authenticating user...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                email: testConfig.email,
                password: testConfig.password
            });
            authToken = loginResponse.data.data.token;
            userId = loginResponse.data.data.user.id;
            console.log('User logged in successfully');
        } catch (loginError) {
            if (loginError.response?.status === 401) {
                console.log('User not found, registering...');
                const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
                    name: 'Test User',
                    email: testConfig.email,
                    password: testConfig.password
                });
                authToken = registerResponse.data.data.token;
                userId = registerResponse.data.data.user.id;
                console.log('User registered successfully');
            } else {
                console.error('Login error details:', {
                    status: loginError.response?.status,
                    message: loginError.response?.data?.message || loginError.message,
                    url: loginError.config?.url
                });
                throw loginError;
            }
        }
        
        console.log('Fetching available rooms...');
        const roomsResponse = await axios.get(`${BASE_URL}/rooms`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (roomsResponse.data.data.length === 0) {
            console.log('No rooms found, creating a test room...');
            const roomData = {
                name: 'Test Conference Room',
                capacity: 10,
                location: 'Test Building',
                amenities: ['Projector', 'Whiteboard']
            };
            const createRoomResponse = await axios.post(`${BASE_URL}/rooms`, roomData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            roomId = createRoomResponse.data.data._id;
        } else {
            roomId = roomsResponse.data.data[0]._id;
        }
        
        console.log('Setup completed successfully');
        return true;
        
    } catch (error) {
        console.error('Setup failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testConcurrentBookings() {
    console.log('\nTesting Concurrent Bookings (Race Condition Prevention)...');
    
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const bookingData = {
        room_id: roomId,
        user_id: userId,
        start_time: futureTime.toISOString(),
        end_time: new Date(futureTime.getTime() + 60 * 60 * 1000).toISOString(),
        purpose: 'Concurrent booking test'
    };
    
    console.log('Test time slot:', bookingData.start_time, 'to', bookingData.end_time);
    console.log(`Sending ${testConfig.concurrentRequests} concurrent requests...`);
    
    const promises = Array(testConfig.concurrentRequests).fill(null).map((_, index) => 
        axios.post(`${BASE_URL}/bookings`, bookingData, {
            headers: { 
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        }).then(response => ({ 
            success: true, 
            data: response.data, 
            index: index + 1,
            bookingId: response.data.data?._id 
        }))
          .catch(error => ({ 
            success: false, 
            error: error.response?.data?.message || error.message, 
            index: index + 1 
        }))
    );
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`Completed in ${endTime - startTime}ms`);
    console.log(`Successful bookings: ${successful.length}`);
    console.log(`Failed bookings: ${failed.length}`);
    
    if (successful.length > 0) {
        console.log('Successful request(s):', successful.map(r => `#${r.index}`).join(', '));
        console.log('Booking ID(s):', successful.map(r => r.bookingId).join(', '));
    }
    
    if (failed.length > 0) {
        console.log('Failed requests:', failed.map(r => `#${r.index}`).join(', '));
        console.log('Sample error:', failed[0]?.error);
    }
    
    for (const result of successful) {
        if (result.bookingId) {
            try {
                await axios.delete(`${BASE_URL}/bookings/${result.bookingId}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                console.log(`Cleaned up booking ${result.bookingId}`);
            } catch (error) {
                console.log(`Cleanup warning for ${result.bookingId}:`, error.response?.data?.message);
            }
        }
    }
    
    if (successful.length === 1 && failed.length === testConfig.concurrentRequests - 1) {
        console.log('PASS: Only 1 booking succeeded (race condition prevented)');
        return true;
    } else {
        console.log('FAIL: Double spending vulnerability detected!');
        console.log(`Expected: 1 success, ${testConfig.concurrentRequests - 1} failures`);
        console.log(`Actual: ${successful.length} successes, ${failed.length} failures`);
        return false;
    }
}

async function runConcurrentTest() {
    console.log('Starting Concurrent Booking Test');
    console.log('===================================\n');
    
    const setupSuccess = await setup();
    if (!setupSuccess) {
        console.log('Test aborted due to setup failure');
        return;
    }
    
    console.log('\nTest Configuration:');
    console.log(`User: ${testConfig.email}`);
    console.log(`Room ID: ${roomId}`);
    console.log(`User ID: ${userId}`);
    console.log(`Concurrent requests: ${testConfig.concurrentRequests}`);
    
    let testPassed = false;
    
    try {
        testPassed = await testConcurrentBookings();
    } catch (error) {
        console.error('\nTest execution error:', error.message);
    }
    
    console.log('\nTEST SUMMARY');
    console.log('================');
    console.log(`${testPassed ? 'PASS' : 'FAIL'} - Concurrent Bookings Test`);
    
    if (testPassed) {
        console.log('\nTEST PASSED!');
        console.log('Your concurrent booking protection is working perfectly!');
        console.log('The race condition prevention is production-ready!');
    } else {
        console.log('\nTEST FAILED!');
        console.log('Race condition vulnerability detected!');
        console.log('Please review the double spending protection implementation.');
    }
}

if (typeof require === 'undefined') {
    console.error('This script requires Node.js to run');
    console.log('Save this as backend/test-double-spending.js and run: node test-double-spending.js');
} else {
    runConcurrentTest().catch(console.error);
}
