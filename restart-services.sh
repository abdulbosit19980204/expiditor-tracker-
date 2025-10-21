#!/bin/bash

# Kill existing processes
pkill -9 -f gunicorn
pkill -9 -f "node.*next"

sleep 2

# Start backend
cd /home/administrator/Documents/expiditor-tracker-/backend
source venv/bin/activate
nohup gunicorn --bind 0.0.0.0:7896 --workers 3 --timeout 120 \
  --access-logfile logs/gunicorn-access.log \
  --error-logfile logs/gunicorn-error.log \
  expeditor_backend.wsgi:application > /dev/null 2>&1 &

echo "Backend started on port 7896"

sleep 2

# Start frontend
cd /home/administrator/Documents/expiditor-tracker-
nohup bash -c "PORT=4563 npm run dev" > /tmp/next-dev.log 2>&1 &

echo "Frontend started on port 4563"
echo "Services are starting in background..."
echo "Check logs:"
echo "  Backend: backend/logs/gunicorn-error.log"
echo "  Frontend: /tmp/next-dev.log"

