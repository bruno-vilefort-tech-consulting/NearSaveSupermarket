import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Check expired PIX orders on startup
  try {
    const { storage } = await import('./storage');
    await storage.checkExpiredPixOrders();
  } catch (error) {
    console.error('Error checking expired PIX orders on startup:', error);
  }

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Production static file serving with correct HTML
  const staticDir = path.resolve(process.cwd(), "dist", "public");
  
  if (!fs.existsSync(staticDir)) {
    console.error(`Static directory not found: ${staticDir}`);
    process.exit(1);
  }

  // Ensure correct HTML content
  const indexPath = path.join(staticDir, "index.html");
  const correctHTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaveUp - Supermercado Sustentável</title>
    <meta name="description" content="Supermercado online sustentável com economia e responsabilidade ambiental" />
    <meta name="theme-color" content="#22c55e" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/icons/icon-192x192.svg" />
    <script type="module" crossorigin src="/assets/index-Dn8HaTzj.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DZbrHXgB.css">
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.addEventListener('error', function(e) {
        console.error('App error:', e.error);
      });
      setTimeout(function() {
        const root = document.getElementById('root');
        if (!root.hasChildNodes()) {
          root.innerHTML = '<div style="padding:20px;text-align:center;font-family:Arial"><h1 style="color:#22c55e">SaveUp</h1><p>Carregando...</p></div>';
        }
      }, 3000);
    </script>
  </body>
</html>`;

  fs.writeFileSync(indexPath, correctHTML);
  console.log(`Static files directory: ${staticDir}`);

  app.use(express.static(staticDir));
  app.use("*", (_req, res) => {
    res.sendFile(indexPath);
  });

  const port = parseInt(process.env.PORT || "5000");
  
  server.listen({
    port: port,
    host: "0.0.0.0",
  }, () => {
    console.log(`SaveUp serving on port ${port}`);
  });
})();