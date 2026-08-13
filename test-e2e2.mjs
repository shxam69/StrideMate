const fs = require('fs');

async function e2e() {
  try {
    const pNum = '+15550000001';
    const email = 'e2e' + Date.now() + '@example.com';
    const pass = 'password123';
    
    // 1. Register a brand-new user
    console.log('1. Registering user...', email);
    const r1 = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'E2E', lastName: 'Test', email: email,
        phoneNumber: pNum, password: pass
      })
    });
    console.log('2. Registration Status:', r1.status);
    if (r1.status !== 201) {
        console.error(await r1.text());
        return;
    }
    
    // 3. Request OTP
    console.log('3. Requesting OTP...');
    const r2 = await fetch('http://localhost:8080/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: pNum })
    });
    console.log('OTP Request Status:', r2.status);
    
    // Read the log file
    await new Promise(resolve => setTimeout(resolve, 2000));
    const logPath = 'C:\\Users\\shyam\\.gemini\\antigravity\\brain\\a8651d9c-d54d-45ae-9ce0-b75b7975ad1f\\.system_generated\\tasks\\task-526.log';
    const logContent = fs.readFileSync(logPath, 'utf8');
    const match = logContent.match(/\[DEV OTP\] phone=\+15550000001 otp=(\d{4})/g);
    if (!match) {
        console.error('OTP not found in log!');
        return;
    }
    // Get the last one
    const lastMatch = match[match.length - 1];
    const otp = lastMatch.split('otp=')[1];
    console.log('Extracted OTP:', otp);
    
    // Verify OTP
    console.log('4. Verifying OTP...');
    const r3 = await fetch('http://localhost:8080/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: pNum, otp: otp })
    });
    console.log('Verify Status:', r3.status);
    
    // Duplicate Phone test
    console.log('5. Duplicate Phone test...');
    const r4 = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'E2E', lastName: 'Duplicate', email: 'e2edup@example.com',
        phoneNumber: pNum, password: pass
      })
    });
    console.log('Duplicate Phone Status:', r4.status);
    console.log('Duplicate Body:', await r4.text());
    
    // Login test
    console.log('6. Login test...');
    const r5 = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass })
    });
    console.log('Login Status:', r5.status);
    const loginData = await r5.json();
    console.log('Login Phone Verified:', loginData.user.phoneVerified);
  } catch (err) {
    console.error(err);
  }
}
e2e();
