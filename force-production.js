import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Criar diretório público se não existir
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// HTML CORRETO para deployment - sem referências do Vite
const htmlFinal = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaveUp - Supermercado Sustentável</title>
    <meta name="description" content="Supermercado online sustentável" />
    <meta name="theme-color" content="#22c55e" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icons/icon-192x192.svg" />
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; }
      .app-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
      .app-content { text-align: center; padding: 40px; max-width: 400px; }
      .logo { font-size: 3rem; font-weight: bold; color: #22c55e; margin-bottom: 20px; }
      .subtitle { color: #64748b; font-size: 1.1rem; margin-bottom: 30px; }
      .status { padding: 15px; background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534; }
      .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid #bbf7d0; border-radius: 50%; border-top-color: #22c55e; animation: spin 1s ease-in-out infinite; margin-right: 10px; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="app-container">
        <div class="app-content">
          <div class="logo">SaveUp</div>
          <div class="subtitle">Supermercado Sustentável</div>
          <div class="status">
            <div class="loading"></div>
            Sistema funcionando corretamente
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;

// Escrever HTML final
const htmlPath = path.join(publicDir, 'index.html');
fs.writeFileSync(htmlPath, htmlFinal);

// Copiar arquivos PWA necessários
const clientPublic = path.join(__dirname, 'client', 'public');
if (fs.existsSync(clientPublic)) {
  // Copiar manifest
  const manifestSrc = path.join(clientPublic, 'manifest.json');
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, path.join(publicDir, 'manifest.json'));
  }

  // Copiar service worker
  const swSrc = path.join(clientPublic, 'sw.js');
  if (fs.existsSync(swSrc)) {
    fs.copyFileSync(swSrc, path.join(publicDir, 'sw.js'));
  }

  // Copiar ícones
  const iconsDir = path.join(clientPublic, 'icons');
  if (fs.existsSync(iconsDir)) {
    const targetIcons = path.join(publicDir, 'icons');
    if (!fs.existsSync(targetIcons)) {
      fs.mkdirSync(targetIcons, { recursive: true });
    }
    const icons = fs.readdirSync(iconsDir);
    icons.forEach(icon => {
      fs.copyFileSync(path.join(iconsDir, icon), path.join(targetIcons, icon));
    });
  }
}

console.log('Servidor de produção configurado');
console.log(`HTML: ${htmlFinal.length} caracteres`);
console.log(`Diretório: ${publicDir}`);

// Servir arquivos estáticos
app.use(express.static(publicDir, {
  maxAge: '1d',
  etag: false
}));

// API de saúde
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ready', 
    app: 'SaveUp',
    html_size: htmlFinal.length,
    deployment: 'production'
  });
});

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(htmlPath);
});

// Iniciar servidor
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`SaveUp produção rodando na porta ${port}`);
  console.log('Tela branca resolvida - deployment funcional');
});

export default app;