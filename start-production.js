import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Determine static files directory
const publicDir = path.resolve(__dirname, 'dist', 'public');

// Ensure HTML is correct
const indexPath = path.join(publicDir, 'index.html');
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

// Write correct HTML
fs.writeFileSync(indexPath, correctHTML);

// Serve static files
app.use(express.static(publicDir));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

// Start server
const port = parseInt(process.env.PORT || "5000");
app.listen(port, '0.0.0.0', () => {
  console.log(`SaveUp production server running on port ${port}`);
});