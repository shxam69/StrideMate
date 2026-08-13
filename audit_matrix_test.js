const http = require('http');

const API_BASE = 'http://localhost:8080/api';

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test(name, fn) {
    process.stdout.write(`Testing: ${name}... `);
    try {
        await fn();
        console.log('✅ PASS');
    } catch (e) {
        console.log('❌ FAIL');
        console.error(e.message);
        process.exit(1);
    }
}

async function registerUser(prefix) {
    const user = {
        email: `${prefix}${Date.now()}@example.com`,
        password: 'Password1!',
        firstName: `${prefix}F${Date.now()}`,
        lastName: `${prefix}L${Date.now()}`,
        phoneNumber: '+14155552671'
    };
    const res = await request('POST', '/auth/register', user);
    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    return { token: res.body.token, id: res.body.user.id };
}

async function runAudit() {
    console.log('Waiting for backend to start...');
    let up = false;
    for (let i = 0; i < 20; i++) {
        try {
            await request('GET', '/activities');
            up = true;
            break;
        } catch (e) {}
        await new Promise(r => setTimeout(r, 1000));
    }
    if (!up) throw new Error('Backend not available');

    console.log('\n--- 1. LEADERBOARD SCENARIO ---');
    let userA, userB, userC;
    await test('Leaderboard overtaking', async () => {
        userA = await registerUser('UserA');
        userB = await registerUser('UserB');
        userC = await registerUser('UserC');
        
        // User A = 300 points
        await request('POST', '/activities', { sport: 'RUNNING', distanceKm: 3 }, { 'Authorization': `Bearer ${userA.token}` });
        // User B = 200 points
        await request('POST', '/activities', { sport: 'RUNNING', distanceKm: 2 }, { 'Authorization': `Bearer ${userB.token}` });
        // User C = 100 points
        await request('POST', '/activities', { sport: 'RUNNING', distanceKm: 1 }, { 'Authorization': `Bearer ${userC.token}` });
        
        // Verify C is rank 3
        let res = await request('GET', '/leaderboard');
        let cRank = res.body.findIndex(u => u.userId === userC.id) + 1;
        if (cRank !== 3 && cRank !== 4 && res.body.length > 3) {
            // Note: DB may have other users, so check relative position
            const aIdx = res.body.findIndex(u => u.userId === userA.id);
            const bIdx = res.body.findIndex(u => u.userId === userB.id);
            const cIdx = res.body.findIndex(u => u.userId === userC.id);
            if (!(aIdx < bIdx && bIdx < cIdx)) throw new Error('Initial order incorrect');
        }

        // Add 150 points to C (Total 250)
        await request('POST', '/activities', { sport: 'RUNNING', distanceKm: 1.5 }, { 'Authorization': `Bearer ${userC.token}` });
        
        // Verify C overtakes B
        res = await request('GET', '/leaderboard');
        const aIdx2 = res.body.findIndex(u => u.userId === userA.id);
        const bIdx2 = res.body.findIndex(u => u.userId === userB.id);
        const cIdx2 = res.body.findIndex(u => u.userId === userC.id);
        if (!(aIdx2 < cIdx2 && cIdx2 < bIdx2)) throw new Error(`Overtaking failed. Indices: A=${aIdx2}, B=${bIdx2}, C=${cIdx2}`);
    });

    console.log('\n--- 5. EXACT FLOORING & BOUNDARY TESTS ---');
    const headers = { 'Authorization': `Bearer ${userA.token}` };
    
    const BOUNDARY_TESTS = [
        { payload: { sport: 'WALKING', distanceKm: 1.55 }, expected: 77 },
        { payload: { sport: 'WALKING', distanceKm: 1.99 }, expected: 99 },
        { payload: { sport: 'SWIMMING', durationMinutes: 0, durationSeconds: 59 }, expected: 0 },
        { payload: { sport: 'SWIMMING', durationMinutes: 1, durationSeconds: 0 }, expected: 15 },
        { payload: { sport: 'SWIMMING', durationMinutes: 1, durationSeconds: 59 }, expected: 15 },
        { payload: { sport: 'SWIMMING', durationMinutes: 2, durationSeconds: 0 }, expected: 30 },
        { payload: { sport: 'GYM', durationMinutes: 0, durationSeconds: 59 }, expected: 0 },
        { payload: { sport: 'GYM', durationMinutes: 1, durationSeconds: 0 }, expected: 5 },
        { payload: { sport: 'GYM', durationMinutes: 1, durationSeconds: 59 }, expected: 5 },
        { payload: { sport: 'GYM', durationMinutes: 2, durationSeconds: 0 }, expected: 10 },
        { payload: { sport: 'DAILY_STEPS', steps: 99 }, expected: 0 },
        { payload: { sport: 'DAILY_STEPS', steps: 100 }, expected: 1 },
        { payload: { sport: 'DAILY_STEPS', steps: 199 }, expected: 1 },
        { payload: { sport: 'DAILY_STEPS', steps: 200 }, expected: 2 },
        { payload: { sport: 'DAILY_STEPS', steps: 299 }, expected: 2 },
        { payload: { sport: 'DAILY_STEPS', steps: 399 }, expected: 3 },
        { payload: { sport: 'DAILY_STEPS', steps: 400 }, expected: 4 }
    ];

    for (const t of BOUNDARY_TESTS) {
        await test(`Boundary: ${JSON.stringify(t.payload)} -> ${t.expected} pts`, async () => {
            const res = await request('POST', '/activities', t.payload, headers);
            if (res.status !== 201) throw new Error(`Failed with ${res.status}`);
            if (res.body.points !== t.expected) throw new Error(`Got ${res.body.points}, expected ${t.expected}`);
        });
    }

    console.log('\n--- 6. INVALID/MISMATCHED METRICS ---');
    const INVALID_TESTS = [
        { payload: { sport: 'RUNNING', durationMinutes: 10 }, name: 'Running + duration' },
        { payload: { sport: 'WALKING', durationMinutes: 10 }, name: 'Walking + duration' },
        { payload: { sport: 'CYCLING', durationMinutes: 10 }, name: 'Cycling + duration' },
        { payload: { sport: 'SWIMMING', distanceKm: 5 }, name: 'Swimming + distance' },
        { payload: { sport: 'GYM', distanceKm: 5 }, name: 'Gym + distance' },
        { payload: { sport: 'DAILY_STEPS', distanceKm: 5 }, name: 'Daily Steps + distance' },
        { payload: { sport: 'RUNNING', steps: 1000 }, name: 'Running + count' },
        { payload: { sport: 'WALKING', steps: 1000 }, name: 'Walking + count' },
        { payload: { sport: 'CYCLING', steps: 1000 }, name: 'Cycling + count' },
        { payload: { sport: 'SWIMMING', steps: 1000 }, name: 'Swimming + count' },
        { payload: { sport: 'GYM', steps: 1000 }, name: 'Gym + count' },
        { payload: { sport: 'RUNNING', distanceKm: -1 }, name: 'negative distance' },
        { payload: { sport: 'GYM', durationMinutes: -5 }, name: 'negative duration' },
        { payload: { sport: 'DAILY_STEPS', steps: -100 }, name: 'negative steps' },
        { payload: { sport: 'RUNNING' }, name: 'missing required metric' },
        { payload: { sport: 'UNKNOWN_SPORT', distanceKm: 1 }, name: 'unknown sport' },
    ];

    for (const t of INVALID_TESTS) {
        await test(`Invalid: ${t.name} -> 400`, async () => {
            const res = await request('POST', '/activities', t.payload, headers);
            if (res.status !== 400) throw new Error(`Got ${res.status}, expected 400. Body: ${JSON.stringify(res.body)}`);
        });
    }

    console.log('\n✅ ALL AUDIT MATRIX VERIFICATIONS PASSED SUCCESSFULLY!');
}

runAudit();
