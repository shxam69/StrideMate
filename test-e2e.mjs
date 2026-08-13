async function e2e() {
  try {
    const pNum = '+15551234567';
    const email = 'e2e' + Date.now() + '@example.com';
    const pass = 'password123';
    
    // 1. Register a brand-new user
    console.log('1. Registering user...');
    const r1 = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'E2E', lastName: 'User', email: email,
        phoneNumber: pNum, password: pass
      })
    });
    console.log('2. Registration Status:', r1.status);
    const r1Data = await r1.json();
    
    // 3. Request OTP
    console.log('3. Requesting OTP...');
    const r2 = await fetch('http://localhost:8080/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: pNum })
    });
    console.log('OTP Request Status:', r2.status);
    
    // Wait for the backend log to flush the OTP so we can read it
  } catch (err) {
    console.error(err);
  }
}
e2e();
