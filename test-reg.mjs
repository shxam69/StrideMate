async function test() {
  try {
    const email = 'unique_email_' + Date.now() + '@example.com';
    const reqBody = {
      firstName: 'TEST1',
      lastName: 'A',
      email: email,
      phoneNumber: '+919342161049',
      password: 'StrideTest123!'
    };
    console.log('Sending payload:', JSON.stringify(reqBody, null, 2));
    
    const res = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    
    const status = res.status;
    const body = await res.text();
    console.log('Response Status:', status);
    console.log('Response Body:', body);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
