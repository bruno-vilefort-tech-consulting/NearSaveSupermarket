import http from 'http';

const testPaths = [
  '/',
  '/assets/index-pVnDco9F.js',
  '/assets/index-DNmSrJ1o.css',
  '/manifest.json',
  '/icons/icon-192x192.png'
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          contentType: res.headers['content-type'] || 'unknown',
          size: data.length
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        status: 'ERROR',
        contentType: 'error',
        size: 0,
        error: err.message
      });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        path,
        status: 'TIMEOUT',
        contentType: 'timeout',
        size: 0
      });
    });

    req.end();
  });
}

console.log('🧪 Testando endpoints...\n');

for (const path of testPaths) {
  try {
    const result = await testEndpoint(path);
    const status = result.status === 200 ? '✅' : '❌';
    
    console.log(`${status} ${result.path}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Content-Type: ${result.contentType}`);
    console.log(`   Size: ${result.size} bytes`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  } catch (error) {
    console.log(`❌ ${path} - ${error.message}\n`);
  }
} 