async function run() {
    try {
        const res = await fetch('http://localhost:8080/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Shyam',
                lastName: 'Tester',
                email: 'shyam@test.com',
                phoneNumber: '+19998887777',
                password: 'password123'
            })
        });
        const data = await res.json();
        const token = data.token;
        console.log('Registered:', data.user);

        const meRes = await fetch('http://localhost:8080/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const me = await meRes.json();
        console.log('Auth Me:', me);

        const dashRes = await fetch('http://localhost:8080/api/dashboard/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const dash = await dashRes.json();
        console.log('Dashboard Me:', dash.user);
    } catch (e) {
        console.error(e);
    }
}
run();
