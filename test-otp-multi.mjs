async function test() {
  try {
    const pNum = '+919342161049';
    
    // register user 1
    const r1 = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test', lastName: 'User1', email: 'u1' + Date.now() + '@example.com',
        phoneNumber: pNum, password: 'password123'
      })
    });
    console.log('Reg 1:', r1.status);
    
    // register user 2
    const r2 = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test', lastName: 'User2', email: 'u2' + Date.now() + '@example.com',
        phoneNumber: pNum, password: 'password123'
      })
    });
    console.log('Reg 2:', r2.status);
    
    // verify OTP. wait, I don't know the valid OTP.
    // BUT I can trigger the DB query directly if I have access to H2!
    // Since I don't have access to H2, I'll just check if there's any other exception.
  } catch (err) {
  }
}
test();
