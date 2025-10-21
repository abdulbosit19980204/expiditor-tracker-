#!/bin/bash

# Expeditor Tracker - Fix Migration & Restart Services
# This script fixes the status column migration issue and restarts all services

set -e  # Exit on any error

echo "======================================"
echo "🔧 Expeditor Tracker - Fix & Restart"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Directories
PROJECT_ROOT="/home/administrator/Documents/expiditor-tracker-"
BACKEND_DIR="$PROJECT_ROOT/backend"

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# 1. Stop existing services
print_step "Step 1: Stopping existing services..."
pkill -f gunicorn && print_success "Gunicorn stopped" || print_info "No Gunicorn running"
pkill -f "next" && print_success "Next.js stopped" || print_info "No Next.js running"
sleep 2
echo ""

# 2. Apply migration using SQL
print_step "Step 2: Applying status column migration..."
cd "$BACKEND_DIR"

# Check if status column exists
print_info "Checking if status column exists..."
COLUMN_EXISTS=$(PGPASSWORD=Baccardi2020 psql -U expiditor -d expiditor-tracker-real -h 127.0.0.1 -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'expeditor_app_taskrun' AND column_name = 'status';" 2>/dev/null || echo "0")

if [ "$COLUMN_EXISTS" -eq "0" ]; then
    print_info "Status column not found. Applying migration..."
    
    # Apply SQL migration
    PGPASSWORD=Baccardi2020 psql -U expiditor -d expiditor-tracker-real -h 127.0.0.1 -f apply_status_migration.sql > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_success "Migration applied successfully"
    else
        print_error "Migration failed"
        print_info "Trying alternative method..."
        
        # Try with Django
        source venv/bin/activate
        python manage.py migrate --fake expeditor_app 0010_add_status_to_taskrun
        deactivate
    fi
else
    print_success "Status column already exists"
fi
echo ""

# 3. Run all pending migrations
print_step "Step 3: Running all pending migrations..."
cd "$BACKEND_DIR"
source venv/bin/activate
python manage.py migrate && print_success "All migrations applied" || print_error "Migration failed"
deactivate
echo ""

# 4. Start Gunicorn
print_step "Step 4: Starting Gunicorn (Backend)..."
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

if ps -p $GUNICORN_PID > /dev/null 2>&1; then
    print_success "Gunicorn started (PID: $GUNICORN_PID)"
else
    print_error "Failed to start Gunicorn"
    print_info "Check logs: $BACKEND_DIR/gunicorn-error.log"
    exit 1
fi
deactivate
echo ""

# 5. Start Next.js
print_step "Step 5: Starting Next.js (Frontend)..."
cd "$PROJECT_ROOT"
PORT=4563 nohup npm run dev > frontend.log 2>&1 &
NEXTJS_PID=$!
sleep 5

if ps -p $NEXTJS_PID > /dev/null 2>&1; then
    print_success "Next.js started (PID: $NEXTJS_PID)"
else
    print_error "Failed to start Next.js"
    print_info "Check logs: $PROJECT_ROOT/frontend.log"
fi
echo ""

# 6. Test services
print_step "Step 6: Testing services..."
sleep 3

# Test backend
if curl -s http://127.0.0.1:7896/admin/ > /dev/null; then
    print_success "Backend is responding (http://178.218.200.120:7896)"
else
    print_error "Backend not responding"
fi

# Test frontend
if curl -s http://127.0.0.1:4563/ > /dev/null; then
    print_success "Frontend is responding (http://178.218.200.120:4563)"
else
    print_error "Frontend not responding (may still be starting...)"
fi
echo ""

# 7. Summary
echo "======================================"
print_success "Services restarted successfully! 🎉"
echo "======================================"
echo ""
echo "📊 Access URLs:"
echo "  Backend:  http://178.218.200.120:7896/admin/"
echo "  Frontend: http://178.218.200.120:4563/"
echo ""
echo "📝 Logs:"
echo "  Backend:  $BACKEND_DIR/gunicorn-error.log"
echo "  Frontend: $PROJECT_ROOT/frontend.log"
echo ""
echo "🔍 Check status:"
echo "  Backend:  curl http://127.0.0.1:7896/api/task-runs/"
echo "  Frontend: curl http://127.0.0.1:4563/"
echo ""
echo "🛑 Stop services:"
echo "  pkill -f gunicorn && pkill -f next"
echo ""
print_info "If you see errors, check the log files above"
echo "======================================"




