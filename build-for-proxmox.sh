#!/bin/bash

# REGMIK ERP - Production Build Script for Proxmox Deployment
# This script creates a complete production build with all latest changes

echo "🚀 Building REGMIK ERP for Proxmox deployment"
echo "=============================================="

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf build

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
# Build client first
npm run vite build
# Build server with production entry point (without Vite dependencies)
npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --outfile=dist/index.js

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deployment-package

# Copy essential files
cp -r dist/* deployment-package/
cp package.json deployment-package/
cp package-lock.json deployment-package/
cp .env.production deployment-package/.env
cp start-production.sh deployment-package/
cp regmik-erp.service deployment-package/

# Copy database migration scripts
mkdir -p deployment-package/migrations
cp -r migrations/* deployment-package/migrations/ 2>/dev/null || echo "No migrations to copy"

# Copy scripts directory
mkdir -p deployment-package/scripts
cp -r scripts/* deployment-package/scripts/ 2>/dev/null || echo "No scripts to copy"

echo "📋 Deployment package contents:"
ls -la deployment-package/

echo ""
echo "🎉 Production build ready!"
echo "📁 Package location: ./deployment-package/"
echo "📝 Upload this package to Proxmox server at /opt/REGMIK_ERP/"
echo ""
echo "🔧 Proxmox deployment commands:"
echo "   1. sudo systemctl stop regmik-erp"
echo "   2. sudo cp -r deployment-package/* /opt/REGMIK_ERP/"
echo "   3. sudo chown -R regmik:regmik /opt/REGMIK_ERP"
echo "   4. cd /opt/REGMIK_ERP && npm install --production"
echo "   5. sudo systemctl start regmik-erp"