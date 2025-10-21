#!/bin/bash
cd /home/administrator/Documents/expiditor-tracker-/backend
source venv/bin/activate
gunicorn --bind 0.0.0.0:7896 --workers 3 --timeout 120 --access-logfile logs/gunicorn-access.log --error-logfile logs/gunicorn-error.log expeditor_backend.wsgi:application

