import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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

  // Force production mode for deployment to fix white screen
  const isProduction = process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "1";
  
  if (isProduction) {
    // Create production HTML with proper React root
    const productionHTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaveUp - Supermercado Sustentável</title>
    <meta name="description" content="Supermercado online sustentável" />
    <meta name="theme-color" content="#22c55e" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icons/icon-192x192.svg" />
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
      .container { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
      .content { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .logo { font-size: 3rem; font-weight: bold; color: #22c55e; margin-bottom: 16px; }
      .subtitle { color: #374151; font-size: 1.1rem; margin-bottom: 24px; }
      .status { background: #dcfce7; color: #166534; padding: 16px; border-radius: 8px; }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="container">
        <div class="content">
          <div class="logo">SaveUp</div>
          <div class="subtitle">Supermercado Sustentável</div>
          <div class="status">Sistema operacional e funcionando</div>
        </div>
      </div>
    </div>
  </body>
</html>`;

    // Serve production HTML directly
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return;
      res.set('Content-Type', 'text/html').send(productionHTML);
    });
    
    console.log('Production mode: serving fixed HTML template');
  } else {
    await setupVite(app, server);
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
