async function test() {
  try {
    // first request OTP
    const reqBody = { phoneNumber: '+919342161049' };
    await fetch('http://localhost:8080/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    
    // then verify OTP
    const verifyRes = await fetch('http://localhost:8080/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '+919342161049', otp: '1234' })
    });
    
    console.log('Response Status:', verifyRes.status);
    console.log('Response Body:', await verifyRes.text());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
