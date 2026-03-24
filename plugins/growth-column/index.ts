/**
 * 成长专栏 - AI书籍导读插件
 * 可插拔设计，通过环境变量控制启用/禁用
 */

import type Database from 'better-sqlite3';

// 检查插件是否启用
export function isEnabled(): boolean {
  return process.env.PLUGIN_GROWTH_COLUMN !== 'false' && 
         process.env.DISABLE_PLUGIN_GROWTH_COLUMN !== 'true';
}

// 初始化数据库
export function initDatabase(db: InstanceType<typeof Database>): void {
  if (!isEnabled()) return;

  try {
    // 读取并执行 schema
    const schema = require('fs').readFileSync(
      require('path').join(__dirname, 'schema.sql'),
      'utf8'
    );

    db.exec(schema);
    console.log('✅ 成长专栏插件数据库初始化完成');
  } catch (error: any) {
    // 如果表已存在，忽略错误
    if (error.message.includes('table already exists')) {
      console.log('ℹ️ 成长专栏插件数据库已存在');
    } else {
      console.error('❌ 成长专栏插件数据库初始化失败:', error);
      throw error;
    }
  }
}

export default {
  name: 'growth-column',
  displayName: '成长专栏',
  description: 'AI智能书籍导读，输入书名即可获取完整导览',
  isEnabled,
  initDatabase
};
