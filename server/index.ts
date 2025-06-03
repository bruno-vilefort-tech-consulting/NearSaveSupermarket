import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 5000;

console.log("Iniciando EcoMarket...");

app.use(express.json());

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
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`EcoMarket funcionando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao inicializar Vite:', error);
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`EcoMarket funcionando na porta ${PORT} (sem Vite)`);
    });
  }
})();