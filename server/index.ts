import express from "express";
import path from "path";
import { createServer } from "http";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static("client/dist"));

console.log("Iniciando EcoMarket...");

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'EcoMarket funcionando',
    timestamp: new Date().toISOString()
  });
});

// Products endpoint
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

// Supermarkets endpoint
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
      name: "Bio Market",
      address: "Av. Sustentável, 456 - São Paulo",
      distance: "3.7 km",
      products: 32
    }
  ]);
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client/index.html'));
});

const server = createServer(app);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`EcoMarket rodando na porta ${PORT}`);
});