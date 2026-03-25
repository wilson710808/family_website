/**
 * 初始化成长专栏插件数据库
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = './family.db';
const db = new Database(dbPath);

console.log('🚀 正在初始化成长专栏插件数据库...');

const schema = fs.readFileSync(path.join(__dirname, 'plugins/growth-column/schema.sql'), 'utf8');

try {
  db.exec(schema);
  console.log('✅ 成长专栏数据库初始化完成！');
  console.log('已创建表格:');
  console.log('  - plugin_growth_book_history');
  console.log('  - plugin_growth_book_favorites');
  console.log('  - plugin_growth_book_recommendations');
} catch (error) {
  if (error.message.includes('table already exists')) {
    console.log('ℹ️ 表格已存在，跳过创建');
  } else {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

db.close();
process.exit(0);
