#!/usr/bin/env node

// Script que roda antes do deployment para garantir arquivos corretos
import fs from 'fs';
import path from 'path';

console.log('🔧 Preparando deployment...');

// HTML template correto
const correctHTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaveUp - Supermercado Sustentável</title>
    <meta name="description" content="Supermercado online sustentável com economia e responsabilidade ambiental" />
    
    <!-- PWA Meta Tags -->
    <meta name="application-name" content="SaveUp" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="SaveUp" />
    <meta name="theme-color" content="#22c55e" />
    
    <!-- Manifest -->
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Icons -->
    <link rel="icon" href="/icons/icon-192x192.svg" />
    <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
    
    <!-- Load existing built assets -->
    <script type="module" crossorigin src="/assets/index-Dn8HaTzj.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DZbrHXgB.css">
  </head>
  <body>
    <div id="root"></div>
    <script>
      // Fallback error handling for production
      window.addEventListener('error', function(e) {
        console.error('App loading error:', e.error);
      });
      
      // Check if React root mounts correctly
      setTimeout(function() {
        const root = document.getElementById('root');
        if (!root.hasChildNodes()) {
          console.error('React app failed to mount');
          root.innerHTML = '<div style="padding: 20px; text-align: center; font-family: Arial;"><h1 style="color: #22c55e;">SaveUp</h1><p>Carregando aplicação...</p><p style="font-size: 14px; color: #666;">Se esta mensagem persistir, recarregue a página.</p></div>';
        }
      }, 5000);
    </script>
  </body>
</html>`;

// Garantir que dist/public existe
if (!fs.existsSync('dist/public')) {
  console.log('❌ dist/public não encontrado - executando build...');
  process.exit(1);
}

// Corrigir HTML em todos os locais possíveis
const htmlLocations = [
  'dist/public/index.html',
  'public/index.html',
  'server/public/index.html'
];

htmlLocations.forEach(location => {
  const dir = path.dirname(location);
  if (fs.existsSync(dir) || location === 'dist/public/index.html') {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(location, correctHTML);
    console.log(`✅ Corrigido: ${location}`);
  }
});

// Copiar arquivos PWA para dist/public
const pwFiles = ['manifest.json', 'sw.js', 'clear-cache.js'];
pwFiles.forEach(file => {
  const src = path.join('client/public', file);
  const dest = path.join('dist/public', file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copiado: ${file}`);
  }
});

// Copiar ícones
if (fs.existsSync('client/public/icons')) {
  if (!fs.existsSync('dist/public/icons')) {
    fs.mkdirSync('dist/public/icons', { recursive: true });
  }
  const icons = fs.readdirSync('client/public/icons');
  icons.forEach(icon => {
    fs.copyFileSync(
      path.join('client/public/icons', icon),
      path.join('dist/public/icons', icon)
    );
  });
  console.log('✅ Ícones copiados');
}

// Verificar assets JavaScript e CSS
const assetsDir = 'dist/public/assets';
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  const cssFile = files.find(f => f.startsWith('index-') && f.endsWith('.css'));
  
  if (jsFile && cssFile) {
    console.log(`✅ Assets encontrados: ${jsFile}, ${cssFile}`);
    
    // Atualizar referências no HTML se necessário
    let finalHTML = correctHTML;
    if (jsFile !== 'index-Dn8HaTzj.js') {
      finalHTML = finalHTML.replace('index-Dn8HaTzj.js', jsFile);
    }
    if (cssFile !== 'index-DZbrHXgB.css') {
      finalHTML = finalHTML.replace('index-DZbrHXgB.css', cssFile);
    }
    
    // Reescrever HTML com referências corretas
    fs.writeFileSync('dist/public/index.html', finalHTML);
    console.log('✅ HTML atualizado com referências corretas');
  } else {
    console.log('⚠️ Assets JavaScript/CSS não encontrados');
  }
} else {
  console.log('❌ Diretório de assets não encontrado');
}

// Verificação final
const finalHTML = fs.readFileSync('dist/public/index.html', 'utf8');
console.log('\n📊 Verificação final:');
console.log(`Tamanho: ${finalHTML.length} caracteres`);
console.log(`SaveUp: ${finalHTML.includes('SaveUp') ? '✅' : '❌'}`);
console.log(`React root: ${finalHTML.includes('<div id="root"></div>') ? '✅' : '❌'}`);
console.log(`JavaScript: ${finalHTML.includes('.js') ? '✅' : '❌'}`);
console.log(`CSS: ${finalHTML.includes('.css') ? '✅' : '❌'}`);

console.log('\n🎯 Deployment preparado com sucesso!');