#!/bin/bash

echo "🚀 Starting deployment process..."

# Build the application
echo "📦 Building the application..."
npm run build

# Copy built files to the correct location for static serving
echo "📂 Setting up static files..."
rm -rf public
cp -r dist/public ./public

# Copy PWA assets and manifest
echo "📱 Adding PWA assets..."
cp -r client/public/* public/

# Update the HTML file with proper PWA metadata
echo "🔧 Updating HTML template..."
cat > public/index.html << 'EOF'
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <link rel="icon" type="image/svg+xml" href="/icons/icon-192x192.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaveUp - Supermercado Sustentável</title>
    <meta name="cache-version" content="v2025-cart-portuguese" />
    
    <!-- PWA Meta Tags -->
    <meta name="application-name" content="SaveUp" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="SaveUp" />
    <meta name="description" content="Supermercado online sustentável com economia e responsabilidade ambiental" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="msapplication-config" content="/browserconfig.xml" />
    <meta name="msapplication-TileColor" content="#22c55e" />
    <meta name="msapplication-tap-highlight" content="no" />
    <meta name="theme-color" content="#22c55e" />
    
    <!-- Manifest -->
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="/icons/icon-152x152.svg" />
    <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
    
    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icons/icon-72x72.svg" />
    <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icons/icon-72x72.svg" />
    <link rel="shortcut icon" href="/icons/icon-72x72.svg" />
    
EOF

# Find and add the built JS and CSS files
JS_FILE=$(find public/assets -name "index-*.js" | head -1)
CSS_FILE=$(find public/assets -name "index-*.css" | head -1)

if [ -n "$JS_FILE" ]; then
    JS_PATH="/${JS_FILE#public/}"
    echo "    <script type=\"module\" crossorigin src=\"$JS_PATH\"></script>" >> public/index.html
fi

if [ -n "$CSS_FILE" ]; then
    CSS_PATH="/${CSS_FILE#public/}"
    echo "    <link rel=\"stylesheet\" crossorigin href=\"$CSS_PATH\">" >> public/index.html
fi

cat >> public/index.html << 'EOF'
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

echo "✅ Deployment preparation complete!"
echo "📋 Files are ready for production deployment"

# List the contents to verify
echo "📁 Contents of public directory:"
ls -la public/

echo "🎯 Your app is ready to deploy! The static files are now in the correct location."