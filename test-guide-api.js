
// 测试本地 guide API - HTTPS
const https = require('https');

const options = {
  hostname: 'localhost',
  port: 443,
  path: '/api/plugins/growth-column/guide',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  rejectUnauthorized: false
};

const postData = JSON.stringify({
  bookName: '原子習慣',
  familyId: 1,
  userId: 1
});

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw (first 1000 chars):');
      console.log(data.slice(0, 1000));
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();
