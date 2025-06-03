import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve from client directory and root
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'EcoMarket API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/supermarkets', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "SuperFresh Eco",
        address: "Rua Verde, 123 - São Paulo, SP",
        distance: "2.1 km",
        productsCount: 45,
        rating: 4.8,
        phone: "(11) 98765-4321"
      },
      {
        id: 2,
        name: "Mercado Sustentável",
        address: "Av. Natureza, 456 - São Paulo, SP", 
        distance: "3.8 km",
        productsCount: 32,
        rating: 4.6,
        phone: "(11) 91234-5678"
      },
      {
        id: 3,
        name: "EcoMart Central",
        address: "Praça Ecológica, 789 - São Paulo, SP",
        distance: "5.2 km", 
        productsCount: 67,
        rating: 4.9,
        phone: "(11) 95555-1234"
      }
    ]
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "Banana Orgânica",
        originalPrice: "R$ 8,99",
        discountPrice: "R$ 5,99",
        category: "Frutas",
        expirationDate: "2025-06-05",
        discount: 33,
        quantity: 25,
        ecoPoints: 15,
        supermarketId: 1
      },
      {
        id: 2,
        name: "Pão Integral",
        originalPrice: "R$ 6,50",
        discountPrice: "R$ 4,00",
        category: "Padaria",
        expirationDate: "2025-06-04",
        discount: 38,
        quantity: 12,
        ecoPoints: 20,
        supermarketId: 1
      },
      {
        id: 3,
        name: "Leite Orgânico 1L",
        originalPrice: "R$ 7,80",
        discountPrice: "R$ 5,50",
        category: "Laticínios",
        expirationDate: "2025-06-06",
        discount: 29,
        quantity: 18,
        ecoPoints: 12,
        supermarketId: 2
      },
      {
        id: 4,
        name: "Tomate Cereja",
        originalPrice: "R$ 12,90",
        discountPrice: "R$ 8,90",
        category: "Vegetais",
        expirationDate: "2025-06-04",
        discount: 31,
        quantity: 30,
        ecoPoints: 18,
        supermarketId: 2
      }
    ]
  });
});

// Catch all handler - serve index.html for any route not handled above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Erro interno do servidor' 
  });
});

// Start server
app.listen(Number(port), '0.0.0.0', () => {
  console.log(`🚀 EcoMarket servidor rodando na porta ${port}`);
  console.log(`📱 Acesse: http://localhost:${port}`);
});