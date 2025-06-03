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
        name: "Mercado Sustentável",
        address: "Av. Natureza, 456 - São Paulo", 
        distance: "3.8 km",
        products: 32
      }
    ]);
  });

  const httpServer = createServer(app);
  return httpServer;
}