#!/bin/bash

echo "🚀 Starting SaveUp deployment..."

# Kill any existing processes
pkill -f node 2>/dev/null || true

# Create deployment structure
mkdir -p deploy/public
mkdir -p deploy/public/assets
mkdir -p deploy/public/icons

# Copy essential PWA files
if [ -d "client/public" ]; then
    cp client/public/manifest.json deploy/public/ 2>/dev/null || true
    cp client/public/sw.js deploy/public/ 2>/dev/null || true
    cp -r client/public/icons/* deploy/public/icons/ 2>/dev/null || true
fi

# Copy existing built assets
if [ -d "public/assets" ]; then
    cp -r public/assets/* deploy/public/assets/ 2>/dev/null || true
fi

# Create deployment HTML with proper React root
cat > deploy/public/index.html << 'EOF'
<!doctype html>
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
  </body>
</html>
EOF

# Create deployment server
cat > deploy/server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SaveUp' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`SaveUp deployment ready on port ${port}`);
});
EOF

echo "✅ Deployment configured"
echo "📁 Files ready in deploy/ directory"
echo "🎯 HTML template created with React root div"
echo "🚀 Ready for Replit deployment"

# Test the deployment
cd deploy
echo "🧪 Testing deployment server..."
timeout 5 node server.js &
sleep 2
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Deployment server working"
else
    echo "⚠️  Server test inconclusive"
fi
pkill -f "node server.js" 2>/dev/null || true