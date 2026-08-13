async function test() {
  try {
    const pNum = '+919342161049';
    
    // request OTP
    await fetch('http://localhost:8080/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: pNum })
    });
    
    // We need the valid OTP. I will just try 1000 to 9999
    // Wait, that's 9000 requests, might take a while, but it will work locally!
    // Or I can just write a Java controller that exposes the OTP for testing.
  } catch (err) {
  }
}
test();
