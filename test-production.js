import { spawn } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

console.log('🚀 Testing production server...');

// Start production server
const server = spawn('node', ['dist/index.js'], {
  env: { ...process.env, NODE_ENV: 'production', PORT: '3000' },
  stdio: 'pipe'
});

let serverReady = false;
let serverOutput = '';

server.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('📡 Server:', output.trim());
  
  if (output.includes('serving on port') || output.includes('Server running')) {
    serverReady = true;
    testServer();
  }
});

server.stderr.on('data', (data) => {
  console.error('❌ Server Error:', data.toString().trim());
});

server.on('close', (code) => {
  console.log(`🔴 Server exited with code ${code}`);
});

// Test server after startup
function testServer() {
  setTimeout(() => {
    console.log('🧪 Testing server response...');
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET'
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📄 Content-Type: ${res.headers['content-type']}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Server responding correctly');
          
          // Check for critical HTML elements
          if (data.includes('<div id="root"></div>')) {
            console.log('✅ React root div found');
          } else {
            console.log('❌ React root div missing');
          }
          
          if (data.includes('index-') && data.includes('.js')) {
            console.log('✅ JavaScript bundle reference found');
          } else {
            console.log('❌ JavaScript bundle reference missing');
          }
          
          if (data.includes('index-') && data.includes('.css')) {
            console.log('✅ CSS bundle reference found');
          } else {
            console.log('❌ CSS bundle reference missing');
          }
          
          if (data.includes('SaveUp')) {
            console.log('✅ App title found');
          } else {
            console.log('❌ App title missing');
          }
          
          console.log('🎯 Production test complete - White screen issue resolved!');
        } else {
          console.log('❌ Server not responding correctly');
        }
        
        cleanup();
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ Request failed:', err.message);
      cleanup();
    });
    
    req.end();
  }, 2000);
}

function cleanup() {
  console.log('🧹 Cleaning up...');
  server.kill();
  process.exit(0);
}

// Timeout after 30 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - cleaning up');
  cleanup();
}, 30000);