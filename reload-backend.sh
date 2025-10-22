#!/bin/bash
# Send HUP signal to reload gunicorn gracefully
kill -HUP $(pgrep -f "gunicorn.*7896" | head -1)
echo "Backend reload signal sent!"










