async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        });
        const text = await res.text();
        console.log('STATUS:', res.status);
        console.log('BODY:', text);
    } catch (e) {
        console.error('FETCH ERROR:', e);
    }
}
test();
