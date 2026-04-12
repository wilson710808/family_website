/**
 * 事件日历插件 - 数据库 Schema（仅服务端）
 */
import fs from 'fs';
import path from 'path';

export function getSchema(): string {
  const schemaPath = path.join(process.cwd(), 'plugins/event-calendar/schema.sql');
  return fs.readFileSync(schemaPath, 'utf8');
}
