import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files directory
const publicDir = path.join(__dirname, 'public');

// Ensure directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create correct HTML template
const correctHTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaveUp - Supermercado Sustentável</title>
    <meta name="description" content="Supermercado online sustentável com economia e responsabilidade ambiental" />
    <meta name="theme-color" content="#22c55e" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icons/icon-192x192.svg" />
    <script type="module" crossorigin src="/assets/index-Dn8HaTzj.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DZbrHXgB.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

// Write HTML file
const htmlPath = path.join(publicDir, 'index.html');
fs.writeFileSync(htmlPath, correctHTML);

// Copy assets if they exist
const assetsSource = path.join(__dirname, 'dist', 'public', 'assets');
const assetsTarget = path.join(publicDir, 'assets');

if (fs.existsSync(assetsSource)) {
  if (!fs.existsSync(assetsTarget)) {
    fs.mkdirSync(assetsTarget, { recursive: true });
  }
  const files = fs.readdirSync(assetsSource);
  files.forEach(file => {
    fs.copyFileSync(path.join(assetsSource, file), path.join(assetsTarget, file));
  });
}

// Copy manifest and icons
const clientPublic = path.join(__dirname, 'client', 'public');
if (fs.existsSync(clientPublic)) {
  ['manifest.json', 'sw.js'].forEach(file => {
    const src = path.join(clientPublic, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(publicDir, file));
    }
  });

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

console.log(`Production server setup complete`);
console.log(`HTML file: ${htmlPath} (${correctHTML.length} chars)`);
console.log(`Public directory: ${publicDir}`);

// Serve static files
app.use(express.static(publicDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SaveUp' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(htmlPath);
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`SaveUp production server running on port ${port}`);
});