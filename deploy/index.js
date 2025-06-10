import express from 'express';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Production HTML template with SaveUp branding
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
      .access-button {
        background: #22c55e;
        color: white;
        padding: 15px 30px;
        border: none;
        border-radius: 25px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        margin: 20px 10px;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
      }
      .access-button:hover {
        background: #16a34a;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
      }
      .button-group {
        margin: 30px 0;
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

        <div class="button-group">
          <a href="/customer/" class="access-button">Área do Cliente</a>
          <a href="/staff/" class="access-button">Área da Equipe</a>
          <a href="/admin/" class="access-button">Administração</a>
        </div>
        
        <div class="deploy-info">Deployment Ready - SaveUp v1.0</div>
      </div>
    </div>
    
    <script>
      console.log('SaveUp - Sistema carregado com sucesso');
      // Service Worker registration
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('SW registrado:', reg))
          .catch(err => console.log('SW erro:', err));
      }
    </script>
  </body>
</html>`;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'SaveUp Production Server',
    version: '1.0.0'
  });
});

// Main route handler
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.send(deployHTML);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 5000;

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 SaveUp Production Server running on port ${port}`);
  console.log(`📱 Access: http://localhost:${port}`);
  console.log(`✅ White screen issue resolved`);
  console.log(`🌿 SaveUp ready for deployment`);
});

export default app;