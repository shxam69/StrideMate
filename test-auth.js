const axios = require('axios');
async function test() {
  try {
    const email = 'test' + Date.now() + '@example.com';
    const password = 'password123';
    
    console.log('Registering with:', { email, password });
    const regRes = await axios.post('http://localhost:8080/api/auth/register', {
      firstName: 'Test',
      lastName: 'User' + Date.now(),
      email,
      phoneNumber: '+1234567890',
      password
    });
    console.log('Register success:', regRes.data);
    
    console.log('Logging in with:', { email, password });
    const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
      email,
      password
    });
    console.log('Login success:', loginRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
test();
