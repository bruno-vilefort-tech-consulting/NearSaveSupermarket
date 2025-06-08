#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const config = {
  customer: {
    title: 'SaveUp - Cliente',
    content: `
    <div class="container">
      <h1>SaveUp - Aplicação do Cliente</h1>
      <p>Esta é a aplicação exclusiva para clientes</p>
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </div>
    `
  },
  staff: {
    title: 'SaveUp - Staff',
    content: `
    <div class="container">
      <h1>SaveUp - Aplicação Staff</h1>
      <p>Esta é a aplicação exclusiva para funcionários</p>
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </div>
    `
  }
};

const appType = process.argv[2] || 'customer';

if (!config[appType]) {
  console.error('Tipo de app inválido. Use: customer ou staff');
  process.exit(1);
}

// Update index.html
const indexPath = path.join(__dirname, 'client', 'index.html');
const template = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config[appType].title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

fs.writeFileSync(indexPath, template);

console.log(`Aplicação alternada para: ${appType}`);
console.log(`Título: ${config[appType].title}`);