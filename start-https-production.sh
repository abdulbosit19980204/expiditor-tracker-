#!/bin/bash

echo "🚀 Starting HTTPS Production Setup..."

# Check if services are running
echo "Checking current services..."
ps aux | grep -E "(gunicorn|next)" | grep -v grep

# Stop existing services
echo "Stopping existing services..."
pkill -f gunicorn
pkill -f "npm run dev"
sleep 2

# Backend setup and start
echo "Starting Django backend with Gunicorn..."
cd /home/administrator/Documents/expiditor-tracker-/backend
source venv/bin/activate

# Collect static files
python3 manage.py collectstatic --noinput

# Start Gunicorn in the background on port 7896
gunicorn --bind 0.0.0.0:7896 --workers 3 --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 50 expeditor_backend.wsgi &
echo "✅ Django backend started on port 7896."

# Frontend setup and start
echo "Starting Next.js frontend..."
cd /home/administrator/Documents/expiditor-tracker-

# Load NVM if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Install dependencies if not already installed
npm install

# Build Next.js for production
npm run build

# Start Next.js in the background on port 4563
npm start -p 4563 &
echo "✅ Next.js frontend started on port 4563."

# Start Nginx with HTTPS config
echo "Starting Nginx with HTTPS configuration..."
echo "⚠️  To start Nginx with HTTPS, run:"
echo "sudo nginx -c /home/administrator/Documents/expiditor-tracker-/nginx-https.conf"

echo ""
echo "🎉 HTTPS Production Setup Complete!"
echo ""
echo "Services running:"
echo "  - Backend (Django): http://127.0.0.1:7896"
echo "  - Frontend (Next.js): http://127.0.0.1:4563"
echo "  - HTTPS (Nginx): https://178.218.200.120"
echo ""
echo "To access the application:"
echo "  - HTTP: http://178.218.200.120 (redirects to HTTPS)"
echo "  - HTTPS: https://178.218.200.120"
echo ""
echo "SSL Certificate: /home/administrator/Documents/expiditor-tracker-/ssl/"
