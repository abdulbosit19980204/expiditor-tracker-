#!/bin/bash

# Expeditor Tracker - Barcha Servislarni Ishga Tushirish
# Script to start all services (Backend, Frontend)

echo "======================================"
echo "🚀 Expeditor Tracker - Service Starter"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="/home/administrator/Documents/expiditor-tracker-"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# 1. Stop existing services
echo "📋 Step 1: Stopping existing services..."
pkill -f gunicorn && print_success "Gunicorn stopped" || print_info "No Gunicorn process found"
pkill -f "next" && print_success "Next.js stopped" || print_info "No Next.js process found"
sleep 2
echo ""

# 2. Backend: Run migrations
echo "📋 Step 2: Running database migrations..."
cd "$BACKEND_DIR"
if [ -d "venv" ]; then
    source venv/bin/activate
    python manage.py migrate && print_success "Migrations applied" || print_error "Migration failed"
    deactivate
else
    print_error "Virtual environment not found at $BACKEND_DIR/venv"
    exit 1
fi
echo ""

# 3. Backend: Start Gunicorn
echo "📋 Step 3: Starting Gunicorn (Backend)..."
cd "$BACKEND_DIR"
source venv/bin/activate
nohup gunicorn expeditor_backend.wsgi:application \
    --bind 0.0.0.0:7896 \
    --workers 4 \
    --timeout 300 \
    --access-logfile gunicorn-access.log \
    --error-logfile gunicorn-error.log \
    > /dev/null 2>&1 &

GUNICORN_PID=$!
sleep 3

if ps -p $GUNICORN_PID > /dev/null; then
    print_success "Gunicorn started (PID: $GUNICORN_PID) on port 7896"
else
    print_error "Failed to start Gunicorn"
    exit 1
fi
deactivate
echo ""

# 4. Frontend: Start Next.js
echo "📋 Step 4: Starting Next.js (Frontend)..."
cd "$FRONTEND_DIR"
PORT=4563 nohup npm run dev > frontend.log 2>&1 &
NEXTJS_PID=$!
sleep 5

if ps -p $NEXTJS_PID > /dev/null; then
    print_success "Next.js started (PID: $NEXTJS_PID) on port 4563"
else
    print_error "Failed to start Next.js"
    exit 1
fi
echo ""

# 5. Check services
echo "📋 Step 5: Checking services..."
echo ""
echo "Backend (Gunicorn):"
curl -s http://127.0.0.1:7896/admin/ > /dev/null && print_success "  ✓ Backend is responding" || print_error "  ✗ Backend not responding"
echo ""
echo "Frontend (Next.js):"
sleep 3
curl -s http://127.0.0.1:4563/ > /dev/null && print_success "  ✓ Frontend is responding" || print_error "  ✗ Frontend not responding"
echo ""

# 6. Summary
echo "======================================"
echo "📊 Service Status Summary"
echo "======================================"
echo "Backend:  http://178.218.200.120:7896"
echo "Frontend: http://178.218.200.120:4563"
echo ""
echo "Logs:"
echo "  Backend:  $BACKEND_DIR/gunicorn-*.log"
echo "  Frontend: $FRONTEND_DIR/frontend.log"
echo ""
echo "To stop services:"
echo "  pkill -f gunicorn"
echo "  pkill -f next"
echo ""
print_success "All services started successfully! 🎉"
echo "======================================"




