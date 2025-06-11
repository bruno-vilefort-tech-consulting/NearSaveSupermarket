import { spawn } from 'child_process';
import fs from 'fs';
const http = require('http');

console.log('Testando deployment real...');

// Verificar se o build está correto
console.log('1. Verificando arquivos de build:');
const criticalFiles = [
  'dist/index.js',
  'dist/public/index.html',
  'dist/public/assets/index-Dn8HaTzj.js',
  'dist/public/assets/index-DZbrHXgB.css'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (exists && file.endsWith('.html')) {
    const content = fs.readFileSync(file, 'utf8');
    console.log(`   Tamanho: ${content.length} chars, Contém SaveUp: ${content.includes('SaveUp')}`);
  }
});

// Verificar configuração do servidor
console.log('\n2. Verificando configuração do servidor...');
if (fs.existsSync('dist/index.js')) {
  const serverCode = fs.readFileSync('dist/index.js', 'utf8');
  const hasStaticConfig = serverCode.includes('express.static');
  const hasIndexFallback = serverCode.includes('index.html');
  console.log(`Express static config: ${hasStaticConfig ? '✅' : '❌'}`);
  console.log(`Index.html fallback: ${hasIndexFallback ? '✅' : '❌'}`);
}

// Simular request de deployment
console.log('\n3. Simulando ambiente de deployment...');

const testServer = spawn('node', ['dist/index.js'], {
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    PORT: '3333'
  },
  stdio: 'pipe'
});

let serverStarted = false;

testServer.stdout.on('data', (data) => {
  const output = data.toString().trim();
  console.log(`Servidor: ${output}`);
  
  if (output.includes('serving') && !serverStarted) {
    serverStarted = true;
    setTimeout(testDeployment, 2000);
  }
});

testServer.stderr.on('data', (data) => {
  console.error(`Erro: ${data.toString().trim()}`);
});

function testDeployment() {
  console.log('\n4. Testando resposta HTTP...');
  
  const testRequests = [
    { path: '/', expectedType: 'text/html' },
    { path: '/assets/index-pVnDco9F.js', expectedType: 'application/javascript' },
    { path: '/assets/index-DNmSrJ1o.css', expectedType: 'text/css' },
    { path: '/manifest.json', expectedType: 'application/json' },
    { path: '/icons/icon-192x192.svg', expectedType: 'image/svg+xml' }
  ];

  async function testServer() {
    console.log('🧪 Testando servidor de produção...\n');
    
    for (const test of testRequests) {
      try {
        const options = {
          hostname: 'localhost',
          port: 5000,
          path: test.path,
          method: 'GET'
        };

        const result = await new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            const contentType = res.headers['content-type'] || '';
            const status = res.statusCode;
            
            resolve({
              path: test.path,
              status,
              contentType,
              expected: test.expectedType,
              success: contentType.includes(test.expectedType) && status === 200
            });
          });

          req.on('error', (err) => {
            reject(err);
          });

          req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Timeout'));
          });

          req.end();
        });

        const icon = result.success ? '✅' : '❌';
        console.log(`${icon} ${result.path}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Content-Type: ${result.contentType}`);
        console.log(`   Expected: ${result.expected}`);
        console.log('');

      } catch (error) {
        console.log(`❌ ${test.path}`);
        console.log(`   Error: ${error.message}`);
        console.log('');
      }
    }
  }

  // Aguardar o servidor inicializar
  import('http').then(({ default: http }) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3333,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (deployment test)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let html = '';
      
      res.on('data', chunk => html += chunk);
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        console.log(`Content-Length: ${html.length}`);
        
        // Análise detalhada
        const checks = {
          'HTML válido': html.startsWith('<!doctype html>') || html.startsWith('<!DOCTYPE html>'),
          'Idioma PT-BR': html.includes('lang="pt-BR"'),
          'Título SaveUp': html.includes('SaveUp'),
          'React root': html.includes('<div id="root"></div>'),
          'Bundle JS': html.includes('index-') && html.includes('.js'),
          'Bundle CSS': html.includes('index-') && html.includes('.css'),
          'PWA manifest': html.includes('manifest.json'),
          'Conteúdo suficiente': html.length > 1000
        };
        
        console.log('\nAnálise do HTML:');
        Object.entries(checks).forEach(([check, passed]) => {
          console.log(`${passed ? '✅' : '❌'} ${check}`);
        });
        
        if (Object.values(checks).every(Boolean)) {
          console.log('\n🎉 DEPLOYMENT OK - Tela branca resolvida!');
        } else {
          console.log('\n❌ PROBLEMA NO DEPLOYMENT');
          console.log('\nPrimeiros 300 caracteres da resposta:');
          console.log(html.substring(0, 300));
          console.log('\n...');
          console.log('\nÚltimos 200 caracteres:');
          console.log(html.substring(Math.max(0, html.length - 200)));
        }
        
        cleanup();
      });
    });
    
    req.on('error', (err) => {
      console.error(`Erro na requisição: ${err.message}`);
      cleanup();
    });
    
    req.end();
  });
}

function cleanup() {
  testServer.kill();
  process.exit(0);
}

setTimeout(() => {
  console.log('Timeout do teste');
  cleanup();
}, 15000);