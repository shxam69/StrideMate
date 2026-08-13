async function test() {
  try {
    const reqBody = {
      firstName: 'TEST1',
      lastName: 'A',
      email: 'unique999@example.com',
      phoneNumber: '+919342161049',
      password: 'StrideTest123!'
    };
    
    const res = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer SOME_INVALID_TOKEN' 
      },
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
