const http = require('http');

function post(port, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

(async () => {
    const email = `test_${Date.now()}@example.com`;
    const data = JSON.stringify({
        email: email,
        password: 'Password@123',
        firstName: 'Test',
        lastName: 'User'
    });

    console.log('--- Testing Backend Direct (3002) ---');
    try {
        const res1 = await post(3002, '/auth/register', data);
        console.log(`Status: ${res1.statusCode}`);
        console.log(`Body: ${res1.body}`);
    } catch (e) {
        console.log('Backend Direct Failed:', e.message);
    }

    console.log('\n--- Testing Frontend Proxy (3000) ---');
    try {
        const res2 = await post(3000, '/api/auth/register', data);
        console.log(`Status: ${res2.statusCode}`);
        console.log(`Body: ${res2.body}`);
    } catch (e) {
        console.log('Frontend Proxy Failed:', e.message);
    }
})();
