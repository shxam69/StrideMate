async function test() {
  try {
    // register a new user
    const pNumber = '+919342161049';
    await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test', lastName: 'User', email: 'otp' + Date.now() + '@example.com',
        phoneNumber: pNumber, password: 'password123'
      })
    });
    
    // request OTP
    await fetch('http://localhost:8080/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: pNumber })
    });
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
