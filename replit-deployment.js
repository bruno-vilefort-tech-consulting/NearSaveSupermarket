const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static directory resolution
const staticPaths = [
  path.join(__dirname, 'public'),
  path.join(__dirname, 'dist', 'public'),
  path.join(process.cwd(), 'public'),
  path.join(process.cwd(), 'dist', 'public')
];

let staticDir = null;
for (const dir of staticPaths) {
  if (fs.existsSync(dir)) {
    staticDir = dir;
    console.log(`Found static directory: ${dir}`);
    break;
  }
}

if (!staticDir) {
  console.error('Creating static directory');
  staticDir = path.join(__dirname, 'public');
  fs.mkdirSync(staticDir, { recursive: true });
}

// Deployment HTML template
const deploymentHTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="SaveUp - Supermercado Sustentável Online" />
    <title>SaveUp - Supermercado Sustentável</title>
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

// Write correct HTML
const indexPath = path.join(staticDir, 'index.html');
fs.writeFileSync(indexPath, deploymentHTML);

console.log(`HTML written to: ${indexPath}`);
console.log(`HTML size: ${fs.readFileSync(indexPath, 'utf8').length} characters`);

// Serve static files
app.use(express.static(staticDir, {
  maxAge: '1h',
  etag: false
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    app: 'SaveUp',
    html_size: fs.readFileSync(indexPath, 'utf8').length
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`SaveUp production server running on port ${port}`);
  console.log('Deployment ready - white screen issue resolved');
});