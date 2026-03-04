async function createUser() {
    const email = 'demo@example.com';
    const password = 'Password@123';

    try {
        // Try register first
        const res = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, displayName: 'Demo User' })
        });
        const data = await res.json();

        if (res.status === 201) {
            console.log('✅ User CREATED:');
            console.log('   Email   :', email);
            console.log('   Password:', password);
            console.log('   User ID :', data.data.user.id);
        } else if (res.status === 409) {
            // Already exists, just log in
            const loginRes = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const loginData = await loginRes.json();
            if (loginRes.ok) {
                console.log('✅ User already EXISTS (logged in successfully):');
                console.log('   Email   :', email);
                console.log('   Password:', password);
                console.log('   User ID :', loginData.data.user.id);
            } else {
                console.log('⚠️  User exists but login failed. Try password: Password@123');
                console.log('   Email   :', email);
                console.log('   Response:', JSON.stringify(loginData));
            }
        } else {
            console.log('❌ Error:', JSON.stringify(data));
        }
    } catch (e) {
        console.error('❌ FETCH ERROR (is backend running on port 3000?):', e.message);
    }
}

createUser();
