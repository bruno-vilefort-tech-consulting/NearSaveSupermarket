import express from 'express';
import path from 'path';

const app = express();

// SaveUp production HTML template
const saveupHTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaveUp - Supermercado Sustentável</title>
    <meta name="description" content="Supermercado online sustentável" />
    <meta name="theme-color" content="#22c55e" />
    <link rel="manifest" href="/manifest.json" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: system-ui, sans-serif; 
        background: linear-gradient(135deg, #f0fdf4, #dcfce7);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .container {
        text-align: center;
        padding: 60px 40px;
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        max-width: 600px;
        width: 90%;
      }
      .logo {
        font-size: 4rem;
        font-weight: bold;
        color: #22c55e;
        margin-bottom: 20px;
      }
      .subtitle {
        color: #374151;
        font-size: 1.3rem;
        margin-bottom: 30px;
      }
      .status {
        background: #dcfce7;
        color: #14532d;
        padding: 20px;
        border-radius: 10px;
        margin: 20px 0;
      }
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 15px;
        margin: 30px 0;
      }
      .feature {
        background: #f8fafc;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }
      .feature-title {
        font-weight: bold;
        color: #22c55e;
        margin-bottom: 5px;
      }
      .btn {
        background: #22c55e;
        color: white;
        padding: 15px 30px;
        border: none;
        border-radius: 25px;
        font-size: 1rem;
        font-weight: bold;
        margin: 10px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
      }
      .btn:hover {
        background: #16a34a;
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="container">
        <div class="logo">SaveUp</div>
        <div class="subtitle">Supermercado Sustentável</div>
        
        <div class="status">
          ✅ Sistema Operacional - Deployment Ready
        </div>
        
        <div class="features">
          <div class="feature">
            <div class="feature-title">Produtos Sustentáveis</div>
            <div>Catálogo eco-friendly</div>
          </div>
          <div class="feature">
            <div class="feature-title">Pagamentos</div>
            <div>PIX e cartão seguro</div>
          </div>
          <div class="feature">
            <div class="feature-title">Entrega</div>
            <div>Delivery sustentável</div>
          </div>
        </div>

        <div>
          <a href="/customer/" class="btn">Cliente</a>
          <a href="/staff/" class="btn">Equipe</a>
          <a href="/admin/" class="btn">Admin</a>
        </div>
      </div>
    </div>
    
    <script>
      console.log('SaveUp carregado');
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
      }
    </script>
  </body>
</html>`;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SaveUp' });
});

// Main route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.set('Content-Type', 'text/html');
  res.send(saveupHTML);
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`SaveUp server running on port ${port}`);
});

export default app;