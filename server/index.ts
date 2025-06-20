import dotenv from "dotenv";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Verificar pedidos PIX expirados na inicialização
  try {
    const { storage } = await import('./storage');
    await storage.checkExpiredPixOrders();
  } catch (error) {
    console.error('Erro ao verificar pedidos PIX expirados na inicialização:', error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use environment port or fallback to 5000
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || "5000");
  
  const startServer = (portToTry: number) => {
    const serverInstance = server.listen({
      port: portToTry,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${portToTry}`);
    });
    
    serverInstance.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${portToTry} is busy, trying ${portToTry + 1}`);
        startServer(portToTry + 1);
      } else {
        throw err;
      }
    });
  };
  
  startServer(port);
})();
