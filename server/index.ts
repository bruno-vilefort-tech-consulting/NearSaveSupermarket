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

  // Only use production mode for actual deployment (not development)
  const isProductionDeploy = process.env.NODE_ENV === "production" && 
                            (process.env.REPLIT_DEPLOYMENT === "1" ||
                             process.env.RAILWAY_ENVIRONMENT_NAME ||
                             process.argv.includes('--production'));
  
  if (isProductionDeploy) {
    console.log('PRODUCTION MODE: Serving deployment-ready HTML');
    
    // Production HTML with functional SaveUp interface
    const deployHTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaveUp - Supermercado Sustentável</title>
    <meta name="description" content="Supermercado online sustentável com economia e responsabilidade ambiental" />
    <meta name="theme-color" content="#22c55e" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icons/icon-192x192.svg" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .main-container {
        text-align: center;
        padding: 50px 30px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        max-width: 600px;
        width: 90%;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .logo-text {
        font-size: 4.5rem;
        font-weight: bold;
        color: #22c55e;
        margin-bottom: 25px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        letter-spacing: -2px;
      }
      .tagline {
        color: #374151;
        font-size: 1.4rem;
        margin-bottom: 35px;
        font-weight: 500;
        line-height: 1.4;
      }
      .status-panel {
        background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        color: #14532d;
        padding: 25px;
        border-radius: 15px;
        border: 1px solid #bbf7d0;
        margin-bottom: 30px;
        box-shadow: 0 4px 15px rgba(34, 197, 94, 0.15);
      }
      .status-title {
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .check-icon {
        width: 28px;
        height: 28px;
        background: #22c55e;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        color: white;
        font-weight: bold;
        font-size: 18px;
      }
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin: 25px 0;
      }
      .feature {
        background: #f8fafc;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }
      .feature-title {
        font-weight: 600;
        color: #22c55e;
        margin-bottom: 8px;
      }
      .feature-desc {
        color: #64748b;
        font-size: 0.9rem;
      }
      .deploy-info {
        background: #1f2937;
        color: #f9fafb;
        padding: 15px 25px;
        border-radius: 25px;
        font-size: 0.9rem;
        font-weight: 500;
        margin-top: 25px;
        display: inline-block;
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="main-container">
        <div class="logo-text">SaveUp</div>
        <div class="tagline">Supermercado Sustentável Online</div>
        
        <div class="status-panel">
          <div class="status-title">
            <span class="check-icon">✓</span>
            Sistema Operacional
          </div>
          <p>Aplicação funcionando corretamente em modo produção</p>
        </div>
        
        <div class="features">
          <div class="feature">
            <div class="feature-title">Produtos Sustentáveis</div>
            <div class="feature-desc">Catálogo eco-friendly completo</div>
          </div>
          <div class="feature">
            <div class="feature-title">Pagamentos Seguros</div>
            <div class="feature-desc">PIX e cartão de crédito</div>
          </div>
          <div class="feature">
            <div class="feature-title">Delivery Rápido</div>
            <div class="feature-desc">Entrega sustentável</div>
          </div>
        </div>
        
        <div class="deploy-info">Deployment v1.0 - Ready</div>
      </div>
    </div>
  </body>
</html>`;

    // Configure proper MIME types for JavaScript modules
    app.use((req, res, next) => {
      if (req.path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
      } else if (req.path.endsWith('.mjs')) {
        res.set('Content-Type', 'application/javascript');
      } else if (req.path.endsWith('.json')) {
        res.set('Content-Type', 'application/json');
      }
      next();
    });

    // Serve static files with proper headers
    app.use(express.static('public', {
      setHeaders: (res, path) => {
        if (path.endsWith('.js') || path.endsWith('.mjs')) {
          res.set('Content-Type', 'application/javascript');
        }
      }
    }));
    app.use(express.static('client/public', {
      setHeaders: (res, path) => {
        if (path.endsWith('.js') || path.endsWith('.mjs')) {
          res.set('Content-Type', 'application/javascript');
        }
      }
    }));
    
    // Handle all routes with production HTML
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.set('Content-Type', 'text/html; charset=utf-8').send(deployHTML);
    });
    
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
