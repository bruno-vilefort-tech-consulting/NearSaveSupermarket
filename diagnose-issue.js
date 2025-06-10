import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Diagnosticando problema da tela branca...');

// Verificar se arquivos estáticos existem nos locais corretos
const staticPaths = [
  'public/index.html',
  'public/assets/index-Dn8HaTzj.js',
  'public/assets/index-DZbrHXgB.css',
  'server/public/index.html',
  'server/public/assets/index-Dn8HaTzj.js',
  'server/public/assets/index-DZbrHXgB.css'
];

console.log('Verificando arquivos estáticos:');
staticPaths.forEach(filePath => {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${filePath}`);
});

// Verificar conteúdo do index.html no local correto
const serverIndexPath = 'server/public/index.html';
if (fs.existsSync(serverIndexPath)) {
  console.log('\nConteúdo do server/public/index.html:');
  const content = fs.readFileSync(serverIndexPath, 'utf8');
  console.log('Tamanho:', content.length, 'caracteres');
  console.log('Contém React root:', content.includes('<div id="root"></div>'));
  console.log('Contém JS bundle:', content.includes('index-') && content.includes('.js'));
  console.log('Contém CSS bundle:', content.includes('index-') && content.includes('.css'));
  console.log('Título:', content.includes('SaveUp'));
} else {
  console.log('\n❌ server/public/index.html não encontrado');
}

// Parar servidor dev e testar produção
console.log('\nParando servidor de desenvolvimento...');
const killDev = spawn('pkill', ['-f', 'tsx server/index.ts']);

killDev.on('close', () => {
  setTimeout(() => {
    console.log('Iniciando servidor de produção...');
    
    const prodServer = spawn('node', ['dist/index.js'], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'pipe'
    });

    prodServer.stdout.on('data', (data) => {
      console.log('Servidor:', data.toString().trim());
      
      if (data.toString().includes('serving on port')) {
        setTimeout(testResponse, 1500);
      }
    });

    prodServer.stderr.on('data', (data) => {
      console.error('Erro:', data.toString().trim());
    });

    function testResponse() {
      import('http').then(({ default: http }) => {
        const req = http.request('http://localhost:5000', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log('\nResposta do servidor:');
            console.log('Status:', res.statusCode);
            console.log('Tamanho:', data.length);
            console.log('Primeiros 200 caracteres:');
            console.log(data.substring(0, 200));
            
            const isValid = data.includes('<div id="root"></div>') && 
                           data.includes('SaveUp') && 
                           data.includes('index-') &&
                           data.length > 1000;
                           
            console.log(isValid ? '\n✅ SUCESSO: Tela branca corrigida!' : '\n❌ PROBLEMA: Ainda há tela branca');
            
            prodServer.kill();
            process.exit(0);
          });
        });
        
        req.on('error', (err) => {
          console.error('Erro na requisição:', err.message);
          prodServer.kill();
          process.exit(1);
        });
        
        req.end();
      });
    }

    setTimeout(() => {
      console.log('Timeout - matando servidor');
      prodServer.kill();
      process.exit(1);
    }, 10000);
    
  }, 2000);
});