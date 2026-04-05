/**
 * 家族管家插件 - 插件入口
 * 可插拔設計，通過環境變量 PLUGIN_FAMILY_BUTLER 控制啟用/禁用
 */

import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export { detectTrigger, generateReply, getFamilyMemories, saveMemory } from './butler';
export type { TriggerType } from './butler';

// 檢查插件是否啟用
export function isEnabled(): boolean {
  return process.env.PLUGIN_FAMILY_BUTLER !== 'false' &&
         process.env.PLUGIN_FAMILY_BUTLER !== '0' &&
         process.env.DISABLE_PLUGIN_FAMILY_BUTLER !== 'true';
}

// 初始化數據庫
export function initDatabase(db: InstanceType<typeof Database>): void {
  if (!isEnabled()) return;

  try {
    const schemaPath = path.join(process.cwd(), 'plugins/family-butler/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✅ 家族管家插件數據庫初始化完成');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ 家族管家插件數據庫已存在');
    } else {
      console.error('❌ 家族管家插件數據庫初始化失敗:', error);
      throw error;
    }
  }
}

export default {
  name: 'family-butler',
  displayName: '家族管家',
  description: 'AI 智能家族管家，具備上下文理解和家族記憶',
  isEnabled,
  initDatabase,
};
