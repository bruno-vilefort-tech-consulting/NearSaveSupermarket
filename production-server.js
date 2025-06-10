import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurar CORS para produção
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Determinar o diretório correto dos arquivos estáticos
const staticPaths = [
  path.join(__dirname, 'dist', 'public'),
  path.join(__dirname, 'public'),
  path.join(process.cwd(), 'dist', 'public'),
  path.join(process.cwd(), 'public')
];

let staticDir = null;
for (const dir of staticPaths) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
    staticDir = dir;
    break;
  }
}

if (!staticDir) {
  console.error('❌ Nenhum diretório de arquivos estáticos encontrado');
  process.exit(1);
}

console.log(`📁 Servindo arquivos estáticos de: ${staticDir}`);

// Verificar se o HTML está correto
const indexPath = path.join(staticDir, 'index.html');
const htmlContent = fs.readFileSync(indexPath, 'utf8');

if (!htmlContent.includes('SaveUp') || htmlContent.length < 1000) {
  console.log('⚠️ HTML incorreto detectado, aplicando correção...');
  
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
    
    <!-- Assets -->
    <script type="module" crossorigin src="/assets/index-Dn8HaTzj.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DZbrHXgB.css">
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.addEventListener('error', function(e) {
        console.error('App error:', e.error);
      });
      
      setTimeout(function() {
        const root = document.getElementById('root');
        if (!root.hasChildNodes()) {
          console.error('React app failed to mount');
          root.innerHTML = '<div style="padding: 20px; text-align: center; font-family: Arial;"><h1 style="color: #22c55e;">SaveUp</h1><p>Carregando...</p></div>';
        }
      }, 5000);
    </script>
  </body>
</html>`;
  
  fs.writeFileSync(indexPath, correctHTML);
  console.log('✅ HTML corrigido');
}

// Servir arquivos estáticos
app.use(express.static(staticDir, {
  maxAge: '1d',
  etag: false
}));

// Rota catch-all para SPA
app.get('*', (req, res) => {
  console.log(`Servindo ${req.path} -> index.html`);
  res.sendFile(indexPath);
});

// Iniciar servidor
const port = parseInt(process.env.PORT || "5000");
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📄 HTML pronto (${htmlContent.length} chars)`);
  console.log(`✅ SaveUp deployment ativo`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});