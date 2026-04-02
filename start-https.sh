#!/bin/bash
export NVM_DIR="/root/.nvm"
source "$NVM_DIR/nvm.sh"
cd /root/.openclaw/workspace/family-portal
export PORT=443
# 用完整路径启动，保证 sudo 能找到 node
echo "Node path: $(which node)"
echo "Starting server on port 443..."
exec npx tsx server.ts
