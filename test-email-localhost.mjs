async function test() {
  try {
    const reqBody = {
      firstName: 'TEST1',
      lastName: 'A',
      email: 'test@localhost',
      phoneNumber: '+919342161049',
      password: 'StrideTest123!'
    };
    
    const res = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    
    console.log('Response Status:', res.status);
    console.log('Response Body:', await res.text());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
