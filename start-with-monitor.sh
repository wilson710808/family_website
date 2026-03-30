#!/bin/bash
# Family Portal 启动脚本 - 配合 systemd 自动监控重启

export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /root/.openclaw/workspace/family-portal

# 加载环境变量
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

echo "Starting Family Portal service..."
echo "Working directory: $(pwd)"
echo "PORT: ${PORT:-3000}"
echo "Node version: $(node -v)"
echo "NPM path: $(which npm)"

npm run start:custom
