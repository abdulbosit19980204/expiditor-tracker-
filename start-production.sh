#!/bin/bash

# Expeditor Tracker Production Start Script
# This script starts both backend and frontend in production mode

set -e

PROJECT_DIR="/home/administrator/Documents/expiditor-tracker-"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Expeditor Tracker in Production Mode${NC}"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔄 Killing processes on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Kill existing processes
echo -e "${YELLOW}🔄 Cleaning up existing processes...${NC}"
kill_port 7896
kill_port 4563
pkill -f "next start" 2>/dev/null || true
pkill -f "npm run start" 2>/dev/null || true

# Start Backend
echo -e "${BLUE}🔧 Starting Django Backend...${NC}"
cd $BACKEND_DIR

# Activate virtual environment
source venv/bin/activate

# Check if migrations are needed
echo -e "${YELLOW}📊 Checking migrations...${NC}"
python3 manage.py migrate --check || {
    echo -e "${YELLOW}📊 Running migrations...${NC}"
    python3 manage.py migrate
}

# Collect static files
echo -e "${YELLOW}📁 Collecting static files...${NC}"
python3 manage.py collectstatic --noinput

# Load production environment
if [ -f "production.env" ]; then
    echo -e "${YELLOW}📋 Loading production environment...${NC}"
    export $(cat production.env | xargs)
fi

# Start Gunicorn in background
echo -e "${GREEN}🚀 Starting Gunicorn on port 7896...${NC}"
nohup gunicorn \
    --bind 0.0.0.0:7896 \
    --workers 3 \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    expeditor_backend.wsgi > gunicorn.log 2>&1 &

BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started with PID: $BACKEND_PID${NC}"

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if curl -s http://localhost:7896/api/ > /dev/null; then
    echo -e "${GREEN}✅ Backend is running on http://localhost:7896${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    exit 1
fi

# Start Frontend
echo -e "${BLUE}🎨 Starting Next.js Frontend...${NC}"
cd $FRONTEND_DIR

# Load Node.js environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Build and start Next.js in production to ensure chunk hashes stay consistent
echo -e "${YELLOW}🧱 Preparing Next.js build (cleaning old artifacts)...${NC}"
export NODE_ENV=production
rm -rf .next
echo -e "${YELLOW}🧱 Building Next.js...${NC}"
npm run build > nextjs.log 2>&1 || (echo -e "${RED}❌ Next.js build failed${NC}" && exit 1)
echo -e "${GREEN}🚀 Starting Next.js on port 4563 (production)...${NC}"
# Bind explicitly to loopback as nginx proxies on 127.0.0.1:4563
nohup npm run start -- -p 4563 -H 0.0.0.0 >> nextjs.log 2>&1 &

FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started with PID: $FRONTEND_PID${NC}"

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
sleep 10

# Check if frontend is running
if curl -s http://localhost:4563/ > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:4563${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    exit 1
fi

# Save PIDs to file
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

echo -e "${GREEN}🎉 Expeditor Tracker is now running in production mode!${NC}"
echo -e "${BLUE}📊 Backend API: http://localhost:7896/api/${NC}"
echo -e "${BLUE}🎨 Frontend: http://localhost:4563/${NC}"
echo -e "${BLUE}👤 Admin Panel: http://localhost:7896/admin/${NC}"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "   Backend: $BACKEND_DIR/gunicorn.log"
echo -e "   Frontend: $FRONTEND_DIR/nextjs.log"
echo ""
echo -e "${YELLOW}🛑 To stop services:${NC}"
echo -e "   kill \$(cat backend.pid) \$(cat frontend.pid)"
echo ""
echo -e "${GREEN}✅ Production startup completed successfully!${NC}"