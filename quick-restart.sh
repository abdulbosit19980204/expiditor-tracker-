#!/bin/bash
cd /home/administrator/Documents/expiditor-tracker-/backend
source venv/bin/activate
nohup gunicorn --bind 0.0.0.0:7896 --workers 3 --timeout 120 --access-logfile logs/gunicorn-access.log --error-logfile logs/gunicorn-error.log expeditor_backend.wsgi:application > /dev/null 2>&1 &
echo "Backend restarted"

