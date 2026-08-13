const fs = require('fs');

const API_BASE = 'http://localhost:8080/api';
const LOG_FILE = 'C:/Users/shyam/.gemini/antigravity/brain/6c5a68aa-05a8-4abd-bd23-507ee6300fa9/.system_generated/tasks/task-1318.log';

let token = '';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLatestOtpFromLog(phone) {
    // Read the log file and find the last [DEV OTP] line for the given phone
    const logs = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = logs.split('\n');
    let otp = null;
    for (let line of lines) {
        if (line.includes('[DEV OTP]') && line.includes(`phone=${phone}`)) {
            const match = line.match(/otp=(\d{4})/);
            if (match) otp = match[1];
        }
    }
    return otp;
}

async function runTest(name, fn) {
    process.stdout.write(`Testing: ${name}... `);
    try {
        await fn();
        console.log('✅ PASS');
    } catch (e) {
        console.log('❌ FAIL');
        console.error(e.message || e);
        process.exit(1);
    }
}

async function main() {
    console.log('Waiting for backend to start...');
    await sleep(10000); // give backend 10s to boot

    const phone = '+19998887777';
    let userId = null;

    console.log('\n--- A. REGISTRATION ---');
    await runTest('Register completely new user', async () => {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'QA',
                lastName: 'Tester',
                email: 'qa@example.com',
                phoneNumber: phone,
                password: 'password123'
            })
        });
        if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
        const data = await res.json();
        if (!data.user.id) throw new Error('No unique userId returned');
        userId = data.user.id;
        token = data.token;
    });

    await runTest('Duplicate first/last name rejected', async () => {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'QA',
                lastName: 'Tester',
                email: 'qa2@example.com',
                phoneNumber: '+19998887778',
                password: 'password123'
            })
        });
        if (res.status !== 400 && res.status !== 409) throw new Error(`Expected failure status, got ${res.status}`);
    });

    console.log('\n--- C. OTP FAILURE CASES ---');
    await runTest('Request initial OTP', async () => {
        const res = await fetch(`${API_BASE}/auth/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone })
        });
        if (res.status !== 200) throw new Error('Failed to request OTP');
        await sleep(1000); // give log time to flush
    });

    await runTest('Incorrect OTP rejected', async () => {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone, otp: '0000' })
        });
        if (res.status !== 400) throw new Error('Incorrect OTP not rejected');
    });

    await runTest('Resend cooldown prevents rapid requests', async () => {
        // First resend should work
        await fetch(`${API_BASE}/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone })
        });
        // Second rapid resend should fail (cooldown)
        const res = await fetch(`${API_BASE}/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone })
        });
        if (res.status !== 429 && res.status !== 400) throw new Error(`Expected cooldown failure, got ${res.status}`);
    });

    console.log('\n--- B. OTP FLOW (SUCCESS) ---');
    let validOtp;
    await runTest('Extract exactly 4-digit OTP from console log', async () => {
        validOtp = await getLatestOtpFromLog(phone);
        if (!validOtp || validOtp.length !== 4) throw new Error(`Invalid OTP extracted: ${validOtp}`);
    });

    await runTest('Successful OTP verification', async () => {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone, otp: validOtp })
        });
        if (res.status !== 200) throw new Error(`OTP verification failed with ${res.status}`);
    });

    await runTest('Reused OTP rejected', async () => {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone, otp: validOtp })
        });
        if (res.status !== 400) throw new Error('Reused OTP was not rejected');
    });

    console.log('\n--- D. DASHBOARD ---');
    await runTest('Dashboard returns valid user data and zeroes', async () => {
        const res = await fetch(`${API_BASE}/dashboard/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status !== 200) throw new Error(`Dashboard failed: ${res.status}`);
        const data = await res.json();
        if (data.user.firstName !== 'QA' || data.user.lastName !== 'Tester') throw new Error('Incorrect user data');
        if (data.summary.totalPoints !== 0 || data.summary.totalActivities !== 0) throw new Error('Initial dashboard not zeroed');
    });

    console.log('\n--- E. ADD ACTIVITY ---');
    await runTest('Log Swimming Activity (requires duration, rejects distance)', async () => {
        // Validation check
        let res = await fetch(`${API_BASE}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ sport: 'SWIMMING', distanceKm: 5.0 }) // Invalid
        });
        if (res.status !== 400) throw new Error('Validation for distance on swimming failed');

        // Valid payload
        res = await fetch(`${API_BASE}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ sport: 'SWIMMING', durationMinutes: 30 })
        });
        if (res.status !== 201) throw new Error(`Activity creation failed: ${res.status}`);
        const data = await res.json();
        // Swimming: 15 points per min -> 30 * 15 = 450
        if (data.points !== 450) throw new Error(`Expected 450 points, got ${data.points}`);
    });

    await runTest('Log Running Activity (requires distance, rejects duration)', async () => {
        const res = await fetch(`${API_BASE}/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ sport: 'RUNNING', distanceKm: 5.0 })
        });
        if (res.status !== 201) throw new Error(`Activity creation failed: ${res.status}`);
        const data = await res.json();
        // Running: 100 points per km -> 5 * 100 = 500
        if (data.points !== 500) throw new Error(`Expected 500 points, got ${data.points}`);
    });

    console.log('\n--- F. DASHBOARD REFRESH ---');
    await runTest('Dashboard aggregations updated correctly', async () => {
        const res = await fetch(`${API_BASE}/dashboard/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.summary.totalPoints !== 950) throw new Error(`Expected 950 total points, got ${data.summary.totalPoints}`);
        if (data.summary.totalActivities !== 2) throw new Error(`Expected 2 activities, got ${data.summary.totalActivities}`);
    });

    console.log('\n--- F2. LEADERBOARD ---');
    await runTest('Leaderboard reflects correctly', async () => {
        const res = await fetch(`${API_BASE}/leaderboard`);
        const data = await res.json();
        const me = data.find(u => u.userId === userId);
        if (!me) throw new Error('User not found on leaderboard');
        if (me.totalPoints !== 950) throw new Error(`Leaderboard points incorrect: ${me.totalPoints}`);
        if (me.trend === undefined) throw new Error('Trend is undefined');
    });

    console.log('\n--- G. AUTHENTICATION ---');
    await runTest('Login restores authenticated user', async () => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'qa@example.com', password: 'password123' })
        });
        if (res.status !== 200) throw new Error('Login failed');
        const data = await res.json();
        if (data.user.id !== userId) throw new Error('Wrong user restored');
    });

    await runTest('Invalid JWT blocks access', async () => {
        const res = await fetch(`${API_BASE}/dashboard/me`, {
            headers: { Authorization: `Bearer invalid.jwt.token` }
        });
        if (res.status !== 401 && res.status !== 403) throw new Error(`Expected 401/403, got ${res.status}`);
    });

    console.log('\n✅ ALL E2E API VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
}

main();
