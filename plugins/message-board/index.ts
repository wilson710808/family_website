/**
 * 留言板插件 - 家族成员留言互动
 * 可插拔設計，通過環境變量控制啟用/禁用
 */

import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 檢查插件是否啟用
export function isEnabled(): boolean {
  return process.env.PLUGIN_MESSAGE_BOARD !== 'false' && 
         process.env.DISABLE_PLUGIN_MESSAGE_BOARD !== 'true';
}

// 初始化數據庫
export function initDatabase(db: any): void {
  if (!isEnabled()) return;

  try {
    // 使用相对路径
    const schemaPath = path.join(process.cwd(), 'plugins/message-board/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema);
    console.log('✅ 留言板插件數據庫初始化完成');
  } catch (error: any) {
    // 如果表已存在，忽略錯誤
    if (error.message.includes('table already exists')) {
      console.log('ℹ️ 留言板插件數據庫已存在');
    } else {
      console.error('❌ 留言板插件數據庫初始化失敗:', error);
      throw error;
    }
  }
}

export default {
  name: 'message-board',
  displayName: '留言板',
  description: '家族成員留言互動功能',
  isEnabled,
  initDatabase
};
