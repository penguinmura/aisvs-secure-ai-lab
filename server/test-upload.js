const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123'
    });
    const token = loginRes.data.token;

    const form = new FormData();
    form.append('image', fs.createReadStream(path.join(__dirname, 'package.json'))); // Intentionally uploading a non-image

    const uploadRes = await axios.post('http://localhost:3000/api/upload/image', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Upload success:', uploadRes.data);

    const salesRes = await axios.get('http://localhost:3000/api/admin/sales', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Sales success:', salesRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
test();
