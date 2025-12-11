const https = require('https');

const options = {
  hostname: 'spirited-liberation-production-1a4d.up.railway.app',
  path: '/api/v1/mold-specifications/64',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('\n=== API Response ===');
      console.log('success:', json.success);
      if (json.data) {
        console.log('created_at:', json.data.created_at);
        console.log('updated_at:', json.data.updated_at);
        console.log('status:', json.data.status);
      }
      console.log('\nFull response (first 2000 chars):');
      console.log(JSON.stringify(json, null, 2).substring(0, 2000));
    } catch (e) {
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.end();
