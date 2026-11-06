#!/bin/bash
# TideNest - quick start script
cd "$(dirname "$0")/tidenest-backend"
PORT=${PORT:-3000}
echo "Starting TideNest on http://localhost:$PORT ..."
node server.js
