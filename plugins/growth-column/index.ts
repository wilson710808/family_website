/**
 * 成長專欄 - AI書籍導讀插件
 * 可插拔設計，通過環境變量控制啟用/禁用
 */

import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 檢查插件是否啟用
export function isEnabled(): boolean {
  return process.env.PLUGIN_GROWTH_COLUMN !== 'false' && 
         process.env.DISABLE_PLUGIN_GROWTH_COLUMN !== 'true';
}

// 初始化數據庫
export function initDatabase(db: InstanceType<typeof Database>): void {
  if (!isEnabled()) return;

  try {
    // 使用相对路径从项目根目录，避免 Turbopack 构建时路径大小写转换问题
    const schemaPath = path.join(process.cwd(), 'plugins/growth-column/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema);
    console.log('✅ 成長專欄插件數據庫初始化完成');
  } catch (error: any) {
    // 如果表已存在，忽略錯誤
    if (error.message.includes('table already exists')) {
      console.log('ℹ️ 成長專欄插件數據庫已存在');
    } else {
      console.error('❌ 成長專欄插件數據庫初始化失敗:', error);
      throw error;
    }
  }
}

export default {
  name: 'growth-column',
  displayName: '成長專欄',
  description: 'AI智能書籍導讀，輸入書名即可獲取完整導覽',
  isEnabled,
  initDatabase
};
