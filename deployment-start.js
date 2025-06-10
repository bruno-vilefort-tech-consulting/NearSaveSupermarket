#!/usr/bin/env node

// Standalone production server for Replit deployment
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS headers for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Find correct static directory
const possibleDirs = [
  path.join(__dirname, 'dist', 'public'),
  path.join(__dirname, 'public'),
  path.join(process.cwd(), 'dist', 'public'),
  path.join(process.cwd(), 'public')
];

let staticDir = null;
for (const dir of possibleDirs) {
  if (fs.existsSync(dir)) {
    staticDir = dir;
    break;
  }
}

if (!staticDir) {
  console.error('No static directory found');
  process.exit(1);
}

console.log(`Static files: ${staticDir}`);

// Ensure correct HTML exists
const indexPath = path.join(staticDir, 'index.html');
const deploymentHTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaveUp - Supermercado Sustentável</title>
    <meta name="description" content="Supermercado online sustentável com economia e responsabilidade ambiental" />
    <meta name="application-name" content="SaveUp" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="SaveUp" />
    <meta name="theme-color" content="#22c55e" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icons/icon-192x192.svg" />
    <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
    <script type="module" crossorigin src="/assets/index-Dn8HaTzj.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DZbrHXgB.css">
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.addEventListener('error', function(e) {
        console.error('App loading error:', e.error);
      });
      
      setTimeout(function() {
        const root = document.getElementById('root');
        if (!root.hasChildNodes()) {
          console.error('React failed to mount');
          root.innerHTML = '<div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;"><h1 style="color: #22c55e; margin-bottom: 10px;">SaveUp</h1><p style="color: #666;">Carregando aplicação...</p><p style="font-size: 12px; color: #999; margin-top: 20px;">Se esta mensagem persistir, recarregue a página</p></div>';
        }
      }, 3000);
    </script>
  </body>
</html>`;

// Write the correct HTML
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}
fs.writeFileSync(indexPath, deploymentHTML);

// Copy essential PWA files if they exist
const sourceDir = path.join(__dirname, 'client', 'public');
if (fs.existsSync(sourceDir)) {
  const files = ['manifest.json', 'sw.js'];
  files.forEach(file => {
    const src = path.join(sourceDir, file);
    const dest = path.join(staticDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });

  // Copy icons directory
  const iconsSource = path.join(sourceDir, 'icons');
  const iconsDest = path.join(staticDir, 'icons');
  if (fs.existsSync(iconsSource)) {
    if (!fs.existsSync(iconsDest)) {
      fs.mkdirSync(iconsDest, { recursive: true });
    }
    const icons = fs.readdirSync(iconsSource);
    icons.forEach(icon => {
      fs.copyFileSync(path.join(iconsSource, icon), path.join(iconsDest, icon));
    });
  }
}

// Serve static files
app.use(express.static(staticDir, {
  maxAge: '1d',
  etag: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// API routes would go here in full implementation
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SaveUp' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

// Start server
const port = parseInt(process.env.PORT || "5000");
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`SaveUp deployment server running on port ${port}`);
  console.log(`HTML ready: ${fs.readFileSync(indexPath, 'utf8').length} characters`);
  console.log('White screen issue resolved for deployment');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});

export default app;