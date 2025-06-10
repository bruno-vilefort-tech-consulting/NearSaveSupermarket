#!/bin/bash

echo "🚀 Starting deployment process..."

# Build the application
echo "📦 Building the application..."
npm run build

# Copy built files to the correct location for static serving
echo "📂 Setting up static files..."
rm -rf public
cp -r dist/public ./public

echo "✅ Deployment preparation complete!"
echo "📋 Files are ready for production deployment"

# List the contents to verify
echo "📁 Contents of public directory:"
ls -la public/

echo "🎯 Your app is ready to deploy! The static files are now in the correct location."