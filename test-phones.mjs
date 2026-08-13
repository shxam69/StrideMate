async function test() {
  const nums = [
    '+919342161049',
    '919342161049',
    '+1234567890',
    '+0123456789',
    '0123456789'
  ];
  
  for (const num of nums) {
    const res = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'T' + Date.now(),
        lastName: 'A',
        email: 't' + Date.now() + '@example.com',
        phoneNumber: num,
        password: 'StrideTest123!'
      })
    });
    console.log(num, res.status);
    if (res.status === 400) {
      console.log('Error:', await res.text());
    }
    // wait a ms
    await new Promise(r => setTimeout(r, 10));
  }
}
test();
