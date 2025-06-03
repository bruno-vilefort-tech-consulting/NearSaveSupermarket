import express, { type Request, type Response, type NextFunction } from "express";
import { log, setupVite } from "./vite";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EcoMarket API is running' });
});

// Basic error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

async function startServer() {
  try {
    console.log("🚀 Starting EcoMarket server...");
    
    const server = await registerRoutes(app);
    
    const port = Number(process.env.PORT) || 5000;
    
    await setupVite(app, server);
    
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();