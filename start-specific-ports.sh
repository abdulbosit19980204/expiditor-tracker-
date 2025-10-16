#!/bin/bash

echo "🚀 Starting Expeditor Tracker with Specific Ports"
echo "================================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="/home/administrator/Documents/expiditor-tracker-"

# Stop existing services
echo -e "${YELLOW}🛑 Stopping existing services...${NC}"
pkill -f gunicorn
pkill -f "next start"
pkill -f "npm start"
sleep 3

# Start Backend on PORT 7896
echo -e "${GREEN}🐍 Starting Django Backend on PORT 7896...${NC}"
cd "$PROJECT_ROOT/backend"
source venv/bin/activate

# Collect static files
python3 manage.py collectstatic --noinput

# Start Gunicorn on port 7896
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
echo -e "${GREEN}✅ Backend started with PID: $BACKEND_PID on PORT 7896${NC}"

# Wait for backend to start
sleep 5

# Start Frontend on PORT 4563
echo -e "${GREEN}🌐 Starting Next.js Frontend on PORT 4563...${NC}"
cd "$PROJECT_ROOT"

# Load NVM if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Start Next.js on port 4563
PORT=4563 nohup npm start > frontend.log 2>&1 &

FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started with PID: $FRONTEND_PID on PORT 4563${NC}"

# Wait for services to start
sleep 10

# Test services
echo -e "${BLUE}🧪 Testing services...${NC}"

# Test Backend
echo -n "Backend (7896): "
if curl -s -f http://localhost:7896/api/statistics/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Test Frontend
echo -n "Frontend (4563): "
if curl -s -f http://localhost:4563/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

echo ""
echo -e "${BLUE}🎉 Expeditor Tracker is running!${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Backend (Django):${NC}  http://178.218.200.120:7896"
echo -e "${GREEN}Frontend (Next.js):${NC} http://178.218.200.120:4563"
echo -e "${GREEN}API Endpoint:${NC}      http://178.218.200.120:7896/api/"
echo -e "${GREEN}Admin Panel:${NC}       http://178.218.200.120:7896/admin/"
echo ""
echo -e "${YELLOW}📋 Process IDs:${NC}"
echo -e "Backend PID: $BACKEND_PID"
echo -e "Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}📁 Logs:${NC}"
echo -e "Backend: $PROJECT_ROOT/backend/gunicorn.log"
echo -e "Frontend: $PROJECT_ROOT/frontend.log"
echo ""
echo -e "${BLUE}🔗 Access URLs:${NC}"
echo -e "Main App: http://178.218.200.120:4563"
echo -e "API Test: http://178.218.200.120:7896/api/statistics/"