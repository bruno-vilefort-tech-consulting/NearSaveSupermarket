#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing deployment white screen issue...');

// Create a minimal index.html that loads the React app correctly
const htmlContent = `<!doctype html>
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
      // Fallback error handling
      window.addEventListener('error', function(e) {
        console.error('Error loading app:', e.error);
      });
      
      // Check if React root mounts correctly
      setTimeout(function() {
        const root = document.getElementById('root');
        if (!root.hasChildNodes()) {
          console.error('React app failed to mount');
          root.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>SaveUp</h1><p>Loading...</p></div>';
        }
      }, 3000);
    </script>
  </body>
</html>`;

// Ensure public directory exists
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

// Write the corrected HTML
fs.writeFileSync('public/index.html', htmlContent);

console.log('✅ Fixed index.html');

// Copy assets if they exist
if (fs.existsSync('dist/public/assets')) {
  if (!fs.existsSync('public/assets')) {
    fs.mkdirSync('public/assets', { recursive: true });
  }
  
  const files = fs.readdirSync('dist/public/assets');
  files.forEach(file => {
    fs.copyFileSync(
      path.join('dist/public/assets', file),
      path.join('public/assets', file)
    );
  });
  console.log('✅ Copied assets');
}

// Copy PWA files
if (fs.existsSync('client/public')) {
  const pwFiles = ['manifest.json', 'sw.js', 'clear-cache.js'];
  pwFiles.forEach(file => {
    const src = path.join('client/public', file);
    const dest = path.join('public', file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
  
  // Copy icons directory
  if (fs.existsSync('client/public/icons')) {
    if (!fs.existsSync('public/icons')) {
      fs.mkdirSync('public/icons', { recursive: true });
    }
    const icons = fs.readdirSync('client/public/icons');
    icons.forEach(icon => {
      fs.copyFileSync(
        path.join('client/public/icons', icon),
        path.join('public/icons', icon)
      );
    });
  }
  console.log('✅ Copied PWA files');
}

console.log('🎯 Deployment fix complete!');
console.log('📁 Files ready in public/ directory');