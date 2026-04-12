#!/bin/bash
# 數據庫定時備份腳本
# 用法: ./backup-db.sh

# 配置
DB_PATH="/root/.openclaw/workspace/family-portal/family.db"
BACKUP_DIR="/root/.openclaw/workspace/family-portal/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/family_${DATE}.db"

# 創建備份目錄
mkdir -p "$BACKUP_DIR"

# 檢查數據庫是否存在
if [ ! -f "$DB_PATH" ]; then
    echo "錯誤: 數據庫文件不存在: $DB_PATH"
    exit 1
fi

# 執行備份 (使用 SQLite 在線備份 API)
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ 備份成功: $BACKUP_FILE"
    echo "   大小: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # 壓縮備份
    gzip "$BACKUP_FILE"
    echo "   已壓縮: ${BACKUP_FILE}.gz"
    
    # 清理舊備份
    find "$BACKUP_DIR" -name "family_*.db.gz" -type f -mtime +$RETENTION_DAYS -delete
    echo "   已清理超過 $RETENTION_DAYS 天的舊備份"
    
    # 保留最近的備份列表
    echo ""
    echo "📁 最近備份:"
    ls -lht "$BACKUP_DIR"/family_*.db.gz 2>/dev/null | head -5
else
    echo "❌ 備份失敗"
    exit 1
fi
