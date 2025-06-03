import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 5000;

app.use(express.json());

console.log("Iniciando EcoMarket...");

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'EcoMarket funcionando' });
});

app.get('/api/products', (req, res) => {
  res.json([
    {
      id: 1,
      name: "Banana Orgânica",
      originalPrice: "8.99",
      discountPrice: "5.99",
      category: "Frutas",
      expirationDate: "2025-06-05",
      ecoPoints: 15,
      quantity: 25
    },
    {
      id: 2,
      name: "Pão Integral",
      originalPrice: "6.50",
      discountPrice: "4.00",
      category: "Padaria",
      expirationDate: "2025-06-04",
      ecoPoints: 20,
      quantity: 12
    }
  ]);
});

app.get('/api/supermarkets', (req, res) => {
  res.json([
    {
      id: 1,
      name: "SuperFresh Eco",
      address: "Rua Verde, 123 - São Paulo",
      distance: "2.1 km",
      products: 45
    },
    {
      id: 2,
      name: "Mercado Sustentável",
      address: "Av. Natureza, 456 - São Paulo",
      distance: "3.8 km",
      products: 32
    }
  ]);
});

const server = createServer(app);

(async () => {
  try {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { port: 24678 }
      },
      appType: 'spa',
      root: process.cwd(),
      publicDir: 'client/public'
    });

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`EcoMarket funcionando na porta ${PORT} com Vite`);
    });
  } catch (error) {
    console.error('Erro ao inicializar Vite:', error);
    
    // Fallback sem Vite
    app.get('*', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>EcoMarket</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            h1 { color: #2d5a27; }
            .status { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🌱 EcoMarket - Supermercado Sustentável</h1>
            <div class="status">
              <strong>Status:</strong> Aplicação restaurada do backup e funcionando!<br>
              Modo de fallback ativo.
            </div>
            <p>Sua plataforma para compras sustentáveis no Brasil</p>
          </div>
        </body>
        </html>
      `);
    });
    
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`EcoMarket funcionando na porta ${PORT} (fallback)`);
    });
  }
})();