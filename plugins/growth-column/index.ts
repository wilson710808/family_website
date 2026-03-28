/**
 * 成長專欄 - AI書籍導讀插件
 * 可插拔設計，通過環境變量控制啟用/禁用
 */

import type Database from 'better-sqlite3';

// 檢查插件是否啟用
export function isEnabled(): boolean {
  return process.env.PLUGIN_GROWTH_COLUMN !== 'false' && 
         process.env.DISABLE_PLUGIN_GROWTH_COLUMN !== 'true';
}

// 初始化數據庫
export function initDatabase(db: InstanceType<typeof Database>): void {
  if (!isEnabled()) return;

  try {
    // 讀取並執行 schema
    const schema = require('fs').readFileSync(
      require('path').join(__dirname, 'schema.sql'),
      'utf8'
    );

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
