import express from "express";
import { log } from "./vite";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static("uploaded_images"));

(async () => {
  const server = await registerRoutes(app);

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    try {
      serveStatic(app);
    } catch (error) {
      console.warn("Static files not available, running in development mode");
      await setupVite(app, server);
    }
  }

  // In development, Vite handles the port. In production, we handle it here.
  if (process.env.NODE_ENV !== "development") {
    const port = Number(PORT);
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  }
})();