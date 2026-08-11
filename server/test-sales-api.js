async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const salesRes = await fetch('http://localhost:3000/api/admin/sales', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(salesRes.status, await salesRes.text());
}
test();
