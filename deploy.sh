#!/bin/bash

echo "🚀 Starting deployment process..."

# Use the existing fix if build fails, otherwise build fresh
echo "📦 Attempting to build the application..."
timeout 60s npm run build || {
    echo "⚠️ Build timed out or failed, using existing build files..."
    if [ ! -d "dist/public" ]; then
        echo "❌ No existing build found. Please run 'npm run build' manually."
        exit 1
    fi
}

# Ensure public directory setup
echo "📂 Setting up static files..."
rm -rf public
mkdir -p public

# Use the deployment fix script
echo "🔧 Running deployment fix..."
node fix-deployment.js

# Verify critical files exist
echo "🔍 Verifying deployment files..."
if [ ! -f "public/index.html" ]; then
    echo "❌ index.html missing"
    exit 1
fi

if [ ! -d "public/assets" ]; then
    echo "❌ Assets directory missing"
    exit 1
fi

if [ ! -f "public/manifest.json" ]; then
    echo "❌ PWA manifest missing"
    exit 1
fi

# Test the HTML file is valid
echo "🧪 Testing HTML file..."
if ! grep -q "<div id=\"root\"></div>" public/index.html; then
    echo "❌ React root div missing from HTML"
    exit 1
fi

if ! grep -q "index-.*\.js" public/index.html; then
    echo "❌ JavaScript file reference missing from HTML"
    exit 1
fi

echo "✅ Deployment preparation complete!"
echo "📋 Files are ready for production deployment"

# List the contents to verify
echo "📁 Contents of public directory:"
ls -la public/

echo "📄 HTML file preview:"
head -20 public/index.html

echo "🎯 Your app is ready to deploy! The static files are now in the correct location."
echo "🔧 The white screen issue should now be resolved."