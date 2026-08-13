async function test() {
  try {
    const email = 'test' + Date.now() + '@example.com';
    const password = 'password123';
    
    console.log('Registering with:', { email, password });
    const regRes = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User' + Date.now(),
        email,
        phoneNumber: '+1234567890',
        password
      })
    });
    const regData = await regRes.json();
    console.log('Register status:', regRes.status, 'Token:', regData.token.substring(0, 10) + '...');
    
    console.log('Logging in with token...');
    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + regData.token
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    console.log('Login status:', loginRes.status);
    if (loginRes.status !== 200) {
       console.error(await loginRes.text());
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
