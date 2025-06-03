import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'success', 
      message: 'EcoMarket API funcionando',
      timestamp: new Date().toISOString()
    });
  });

  // Basic API endpoints for testing
  app.get('/api/supermarkets', (req, res) => {
    res.json({
      supermarkets: [
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
      ]
    });
  });

  app.get('/api/products', (req, res) => {
    res.json({
      products: [
        {
          id: 1,
          name: "Banana Orgânica",
          originalPrice: "R$ 8,99",
          discountPrice: "R$ 5,99",
          category: "Frutas",
          expirationDate: "2025-06-05",
          discount: 33
        },
        {
          id: 2,
          name: "Pão Integral",
          originalPrice: "R$ 6,50",
          discountPrice: "R$ 4,00",
          category: "Padaria",
          expirationDate: "2025-06-04",
          discount: 38
        }
      ]
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}