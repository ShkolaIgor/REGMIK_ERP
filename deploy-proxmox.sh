#!/bin/bash

# REGMIK ERP Proxmox Container Deployment Script
# Automated deployment for production environment

set -e  # Exit on any error

echo "=== REGMIK ERP Proxmox Deployment ==="
echo "Starting automated deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root for security reasons"
   exit 1
fi

# Step 1: Environment validation
log_info "Validating environment..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    log_error "Node.js not found. Please install Node.js 18+ first"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version 18+ required. Current: $(node --version)"
    exit 1
fi

log_info "Node.js version: $(node --version) ✓"

# Check npm
if ! command -v npm &> /dev/null; then
    log_error "npm not found"
    exit 1
fi

log_info "npm version: $(npm --version) ✓"

# Step 2: Install dependencies
log_info "Installing dependencies..."
npm install

# Step 3: Environment variables setup
log_info "Setting up environment variables..."

if [ ! -f ".env.production" ]; then
    log_warning "Creating .env.production template"
    cat > .env.production << EOF
# Production Environment Variables for REGMIK ERP
NODE_ENV=production
PORT=3000

# Database Configuration (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_PQu4CAr9yIYq@ep-spring-flower-a552xsk9.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Session Security
SESSION_SECRET=regmik_production_$(openssl rand -hex 32)

# Nova Poshta API
NOVA_POSHTA_API_KEY=your_nova_poshta_api_key_here

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Working SMTP (backup)
WORKING_SMTP_HOST=smtp.gmail.com
WORKING_SMTP_PORT=587
WORKING_SMTP_USER=your_email@gmail.com
WORKING_SMTP_PASSWORD=your_app_password
EOF
    log_warning "Please edit .env.production with your actual credentials"
fi

# Step 4: Database initialization
log_info "Initializing database..."
if ! npm run db:push; then
    log_error "Database initialization failed"
    exit 1
fi

log_info "Database schema synchronized ✓"

# Step 5: Build application (optional)
log_info "Building application for production..."
if npm run build 2>/dev/null; then
    log_info "Application built successfully ✓"
else
    log_warning "Build failed, continuing with source files"
fi

# Step 6: Test production launcher
log_info "Testing production launcher..."

# Load environment variables
export $(grep -v '^#' .env.production | xargs)

# Test server startup
timeout 10 bash -c 'npx tsx server/production.ts &
SERVER_PID=$!
sleep 5
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✓ Production server test successful"
    kill $SERVER_PID
else
    echo "✗ Production server test failed"
    exit 1
fi' || {
    log_error "Production launcher test failed"
    exit 1
}

# Step 7: Install systemd service (skip in Replit environment)
if command -v systemctl &> /dev/null; then
    log_info "Installing systemd service..."

    # Update service file with correct paths
    sed "s|/home/runner/workspace|$(pwd)|g" regmik-erp-simple.service > /tmp/regmik-erp.service
    sed -i "s|User=runner|User=$(whoami)|g" /tmp/regmik-erp.service

    # Copy environment file for systemd
    sudo cp .env.production /etc/regmik-erp.env
    sudo chown root:root /etc/regmik-erp.env
    sudo chmod 600 /etc/regmik-erp.env

    # Install service
    sudo cp /tmp/regmik-erp.service /etc/systemd/system/
    sudo systemctl daemon-reload

    log_info "Systemd service installed ✓"

    # Step 8: Start and enable service
    log_info "Starting REGMIK ERP service..."

    sudo systemctl enable regmik-erp
    sudo systemctl start regmik-erp

    # Wait for service to start
    sleep 5

    if sudo systemctl is-active --quiet regmik-erp; then
        log_info "REGMIK ERP service started successfully ✓"
    else
        log_error "Service failed to start. Check logs: sudo journalctl -u regmik-erp -f"
        exit 1
    fi
else
    log_warning "Systemd not available (Replit environment detected)"
    log_info "Service files prepared for manual installation in Proxmox"
fi

# Step 9: Configure firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    log_info "Configuring firewall..."
    sudo ufw allow 3000/tcp
    log_info "Firewall configured for port 3000 ✓"
fi

# Step 10: Final verification
log_info "Running final verification..."

# Check service status
SERVICE_STATUS=$(sudo systemctl is-active regmik-erp)
if [ "$SERVICE_STATUS" = "active" ]; then
    log_info "Service status: $SERVICE_STATUS ✓"
else
    log_error "Service status: $SERVICE_STATUS"
    exit 1
fi

# Check if port is listening
if netstat -tuln | grep -q ":3000 "; then
    log_info "Port 3000 is listening ✓"
else
    log_error "Port 3000 is not listening"
    exit 1
fi

# Success message
echo ""
echo "=================================="
echo -e "${GREEN}🚀 REGMIK ERP DEPLOYMENT SUCCESSFUL${NC}"
echo "=================================="
echo ""
echo "Application Details:"
echo "- Status: Running"
echo "- Port: 3000"
echo "- Environment: Production"
echo "- Service: regmik-erp"
echo ""
echo "Management Commands:"
echo "- Check status: sudo systemctl status regmik-erp"
echo "- View logs: sudo journalctl -u regmik-erp -f"
echo "- Restart: sudo systemctl restart regmik-erp"
echo "- Stop: sudo systemctl stop regmik-erp"
echo ""
echo "Access your application at: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"