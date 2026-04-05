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

// ============ 公告操作 ============

// 獲取即將到來需要提前提醒的公告
export function getEarlyNotifications(db: Database, targetDate: string) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE notified_early = 0
    AND date(event_date, '-' || notify_days_before || ' days') = ?
    ORDER BY event_date ASC
  `);
  return stmt.all(targetDate) as any[];
}

// 獲取今天舉行的活動公告
export function getTodaysAnnouncements(db: Database, today: string) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE event_date = ? AND notified_today = 0
    ORDER BY event_time ASC
  `);
  return stmt.all(today) as any[];
}

// 標記提前通知已發送
export function markEarlyNotified(db: Database, id: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_butler_announcements SET notified_early = 1 WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

// 標記當天通知已發送
export function markTodayNotified(db: Database, id: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_butler_announcements SET notified_today = 1 WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

// 獲取即將到來的公告
export function getUpcomingAnnouncements(db: Database, familyId: number) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE family_id = ? AND event_date >= date('now')
    ORDER BY event_date ASC
  `);
  return stmt.all(familyId) as any[];
}

// ============ 提醒操作 ============

// 獲取今天需要提醒的事項
export function getTodaysReminders(db: Database, today: string) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_scheduled_reminders
    WHERE remind_date = ? AND reminded = 0
    ORDER BY remind_time ASC
  `);
  return stmt.all(today) as any[];
}

// 標記提醒已發送
export function markReminderSent(db: Database, id: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_butler_scheduled_reminders SET reminded = 1 WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

// 獲取家族所有未提醒
export function getUpcomingReminders(db: Database, familyId: number) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_scheduled_reminders
    WHERE family_id = ? AND reminded = 0 AND remind_date >= date('now')
    ORDER BY remind_date ASC
  `);
  return stmt.all(familyId) as any[];
}

// ============ 節日檢測 ============

// 檢查今天是不是節日
export function isTodayHoliday(): {isHoliday: boolean; name: string} {
  const today = new Date();
  const taipeiDate = new Date(today.getTime() + 8 * 60 * 60 * 1000);
  const month = taipeiDate.getUTCMonth() + 1;
  const date = taipeiDate.getUTCDate();
  const mmdd = `${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;

  const holidays: Record<string, string> = {
    '01-01': '元旦',
    '02-14': '情人節',
    '05-01': '勞動節',
    '10-01': '國慶節',
    '12-25': '聖誕節',
  };

  if (mmdd in holidays) {
    return { isHoliday: true, name: holidays[mmdd] };
  }
  return { isHoliday: false, name: '' };
}

export default {
  name: 'family-butler',
  displayName: '家族管家',
  description: 'AI 智能家族管家，具備上下文理解和家族記憶',
  isEnabled,
  initDatabase,
  getEarlyNotifications,
  getTodaysAnnouncements,
  markEarlyNotified,
  markTodayNotified,
  getUpcomingAnnouncements,
  getTodaysReminders,
  markReminderSent,
  getUpcomingReminders,
  isTodayHoliday,
};
