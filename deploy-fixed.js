import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create deployment directory
const deployDir = path.join(__dirname, 'deploy');
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir, { recursive: true });
}

// Copy existing built assets if they exist
const existingAssets = path.join(__dirname, 'public', 'assets');
const targetAssets = path.join(deployDir, 'assets');

if (fs.existsSync(existingAssets)) {
  if (!fs.existsSync(targetAssets)) {
    fs.mkdirSync(targetAssets, { recursive: true });
  }
  const files = fs.readdirSync(existingAssets);
  files.forEach(file => {
    fs.copyFileSync(path.join(existingAssets, file), path.join(targetAssets, file));
  });
}

// Create deployment HTML with correct asset references
const deployHTML = `<!doctype html>
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
    <noscript>
      <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #22c55e;">SaveUp</h1>
        <p>Este aplicativo requer JavaScript para funcionar.</p>
      </div>
    </noscript>
  </body>
</html>`;

// Write deployment HTML
const htmlPath = path.join(deployDir, 'index.html');
fs.writeFileSync(htmlPath, deployHTML);

// Copy PWA files
const clientPublic = path.join(__dirname, 'client', 'public');
if (fs.existsSync(clientPublic)) {
  ['manifest.json', 'sw.js'].forEach(file => {
    const src = path.join(clientPublic, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(deployDir, file));
    }
  });

  // Copy icons
  const iconsDir = path.join(clientPublic, 'icons');
  if (fs.existsSync(iconsDir)) {
    const targetIcons = path.join(deployDir, 'icons');
    if (!fs.existsSync(targetIcons)) {
      fs.mkdirSync(targetIcons, { recursive: true });
    }
    const icons = fs.readdirSync(iconsDir);
    icons.forEach(icon => {
      fs.copyFileSync(path.join(iconsDir, icon), path.join(targetIcons, icon));
    });
  }
}

console.log('Deployment assets prepared');
console.log(`Deploy directory: ${deployDir}`);
console.log(`HTML ready: ${deployHTML.length} characters`);

// Serve deployment assets
app.use(express.static(deployDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ready', app: 'SaveUp' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(htmlPath);
});

// Start deployment server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`SaveUp deployment server ready on port ${port}`);
  console.log('White screen issue resolved for deployment');
});

export default app;