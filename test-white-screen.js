import { spawn } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

console.log('Testando servidor de produção...');

// Parar servidor de desenvolvimento primeiro
console.log('Parando servidor de desenvolvimento...');
spawn('pkill', ['-f', 'tsx server/index.ts'], { stdio: 'ignore' });

// Aguardar um pouco e iniciar servidor de produção
setTimeout(() => {
  console.log('Iniciando servidor de produção...');
  startProductionServer();
}, 2000);

function startProductionServer() {
  const server = spawn('node', ['dist/index.js'], {
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let testCompleted = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('Servidor:', output.trim());
  
  if (output.includes('serving on port 3001') && !testCompleted) {
    testCompleted = true;
    setTimeout(testHTML, 1000);
  }
});

server.stderr.on('data', (data) => {
  console.error('Erro do servidor:', data.toString().trim());
});

function testHTML() {
  console.log('Testando resposta HTML...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/',
    method: 'GET'
  }, (res) => {
    let html = '';
    
    res.on('data', (chunk) => {
      html += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        // Verificar elementos críticos
        const checks = [
          { test: html.includes('<div id="root"></div>'), name: 'React root div' },
          { test: html.includes('SaveUp'), name: 'Título da aplicação' },
          { test: html.includes('index-') && html.includes('.js'), name: 'Referência JavaScript' },
          { test: html.includes('index-') && html.includes('.css'), name: 'Referência CSS' },
          { test: html.includes('manifest.json'), name: 'Manifest PWA' },
          { test: html.length > 1000, name: 'Conteúdo suficiente' }
        ];
        
        console.log('\nVerificação de elementos:');
        let allPassed = true;
        
        checks.forEach(check => {
          const status = check.test ? '✅' : '❌';
          console.log(`${status} ${check.name}`);
          if (!check.test) allPassed = false;
        });
        
        if (allPassed) {
          console.log('\n🎉 SUCESSO: Tela branca foi corrigida!');
        } else {
          console.log('\n❌ PROBLEMA: Ainda há elementos faltando');
          console.log('\nPrimeiros 500 caracteres do HTML:');
          console.log(html.substring(0, 500));
        }
      } else {
        console.log('❌ Servidor não respondeu corretamente');
      }
      
      cleanup();
    });
  });
  
  req.on('error', (err) => {
    console.error('Erro na requisição:', err.message);
    cleanup();
  });
  
  req.end();
}

function cleanup() {
  server.kill();
  process.exit(0);
}

// Timeout de segurança
setTimeout(() => {
  console.log('Timeout do teste');
  cleanup();
}, 15000);