#!/bin/bash

# Manual launcher for REGMIK ERP in environments without systemd
# Use this for testing or environments where systemd is not available

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting REGMIK ERP manually...${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}Warning: .env.production not found${NC}"
    echo "Creating basic production environment..."
    
    cat > .env.production << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://neondb_owner:npg_PQu4CAr9yIYq@ep-spring-flower-a552xsk9.us-east-2.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=regmik_production_$(openssl rand -hex 16 2>/dev/null || echo "regmik_fallback_secret")
EOF
fi

# Load environment variables
export $(grep -v '^#' .env.production | xargs)

echo "Environment loaded:"
echo "- NODE_ENV: $NODE_ENV"
echo "- PORT: $PORT"
echo "- Database: $(echo $DATABASE_URL | sed 's/.*@//' | cut -d'/' -f2)"

# Check dependencies
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js and npm${NC}"
    exit 1
fi

# Start the server
echo -e "${GREEN}Starting production server...${NC}"
echo "Choose server mode:"
echo "1. API-only server (швидкий запуск)"
echo "2. Production UI server (повний веб-інтерфейс)"
echo ""

read -p "Виберіть режим (1 або 2): " mode

if [ "$mode" = "2" ]; then
    echo "Запуск з повним веб-інтерфейсом..."
    npx tsx server/production-ui.ts
else
    echo "Запуск API-only сервера..."
    npx tsx server/production.ts
fi