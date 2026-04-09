
const API_URL = 'http://localhost:3000/api';

async function testAuth() {
    console.log('--- Testing Auth and RBAC ---');

    const testUser = {
        email: `test_${Date.now()}@example.com`,
        password: 'Password123!',
        first_name: 'Test',
        last_name: 'User',
        role: 'ADMIN'
    };

    try {
        // 1. Test Register
        console.log('\n1. Testing Register...');
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const registerData = await registerRes.json();
        if (registerRes.ok) {
            console.log('✅ Register successful');
        } else {
            console.error('❌ Register failed:', registerData);
            return;
        }

        // 2. Test Login
        console.log('\n2. Testing Login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
            console.log('✅ Login successful');
        } else {
            console.error('❌ Login failed:', loginData);
            return;
        }

        const accessToken = loginData.access_token;

        // 3. Test RBAC (Assuming we have a protected endpoint)
        // Let's find a protected endpoint first.
        console.log('\n3. Testing Protected Endpoint (Profile/Users)...');
        const userRes = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const userData = await userRes.json();
        if (userRes.ok) {
            console.log('✅ Protected endpoint access successful');
        } else {
            console.warn('⚠️ Protected endpoint access failed (maybe role issues?):', userData);
        }

        console.log('\n--- Verification Finished ---');
    } catch (err) {
        console.error('❌ Connection error. Is the app running on port 3000?', err.message);
    }
}

testAuth();
