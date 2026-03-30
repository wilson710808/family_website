#!/bin/bash
export NVM_DIR="/root/.nvm"
source "$NVM_DIR/nvm.sh"
cd /root/.openclaw/workspace/family-portal
export PORT=443
exec npm run start:custom
