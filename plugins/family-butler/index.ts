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
export function getEarlyNotifications(db: any, targetDate: string) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE notified_early = 0
    AND date(event_date, '-' || notify_days_before || ' days') = ?
    ORDER BY event_date ASC
  `);
  return stmt.all(targetDate) as any[];
}

// 獲取今天舉行的活動公告
export function getTodaysAnnouncements(db: any, today: string) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE event_date = ? AND notified_today = 0
    ORDER BY event_time ASC
  `);
  return stmt.all(today) as any[];
}

// 標記提前通知已發送
export function markEarlyNotified(db: any, id: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_butler_announcements SET notified_early = 1 WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

// 標記當天通知已發送
export function markTodayNotified(db: any, id: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_butler_announcements SET notified_today = 1 WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

// 獲取即將到來的公告
export function getUpcomingAnnouncements(db: any, familyId: number) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE family_id = ? AND event_date >= date('now')
    ORDER BY event_date ASC
  `);
  return stmt.all(familyId) as any[];
}

// 創建公告
export function createAnnouncement(db: any, data: {
  family_id: number;
  user_id: number;
  creator_name: string;
  title: string;
  content: string;
  event_date: string;
  event_time: string | null;
  notify_days_before: number;
}) {
  const stmt = db.prepare(`
    INSERT INTO plugin_butler_announcements (family_id, user_id, creator_name, title, content, event_date, event_time, notify_days_before)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.family_id,
    data.user_id,
    data.creator_name,
    data.title,
    data.content,
    data.event_date,
    data.event_time,
    data.notify_days_before
  );
}

// ============ 提醒操作 ============

// 獲取今天需要提醒的事項
export function getTodaysReminders(db: any, today: string) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_scheduled_reminders
    WHERE remind_date = ? AND reminded = 0
    ORDER BY remind_time ASC
  `);
  return stmt.all(today) as any[];
}

// 標記提醒已發送
export function markReminderSent(db: any, id: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_butler_scheduled_reminders SET reminded = 1 WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

// 獲取家族所有未提醒
export function getUpcomingReminders(db: any, familyId: number) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_scheduled_reminders
    WHERE family_id = ? AND reminded = 0 AND remind_date >= date('now')
    ORDER BY remind_date ASC
  `);
  return stmt.all(familyId) as any[];
}

// 創建提醒
export function createReminder(db: any, data: {
  family_id: number;
  created_by: number;
  creator_name: string;
  content: string;
  remind_date: string;
  remind_time: string | null;
}) {
  const stmt = db.prepare(`
    INSERT INTO plugin_butler_scheduled_reminders (family_id, created_by, creator_name, content, remind_date, remind_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.family_id,
    data.created_by,
    data.creator_name,
    data.content,
    data.remind_date,
    data.remind_time
  );
}

// ============ 聊天記憶操作 ============

// 獲取家族聊天記憶
export function getChatMemory(db: any, familyId: number, limit: number = 100) {
  return db.prepare(`
    SELECT * FROM plugin_butler_chat_memory
    WHERE family_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(familyId, limit);
}

// 獲取指定年份的聊天記憶
export function getChatMemoryByYear(db: any, familyId: number, year: number) {
  return db.prepare(`
    SELECT * FROM plugin_butler_chat_memory
    WHERE family_id = ? AND strftime('%Y', created_at) = ?
    ORDER BY created_at ASC
  `).all(familyId, year.toString());
}

// ============ 年度總結操作 ============

// 保存年度總結
export function saveAnnualSummary(db: any, familyId: number, year: number, summary: string, keyTopics: string[]) {
  const existing = db.prepare(`
    SELECT id FROM plugin_butler_annual_summaries WHERE family_id = ? AND year = ?
  `).get(familyId, year);

  const keyTopicsJson = JSON.stringify(keyTopics);

  if (existing) {
    return db.prepare(`
      UPDATE plugin_butler_annual_summaries
      SET summary_content = ?, key_topics = ?, created_at = CURRENT_TIMESTAMP
      WHERE family_id = ? AND year = ?
    `).run(summary, keyTopicsJson, familyId, year);
  } else {
    return db.prepare(`
      INSERT INTO plugin_butler_annual_summaries (family_id, year, summary_content, key_topics)
      VALUES (?, ?, ?, ?)
    `).run(familyId, year, summary, keyTopicsJson);
  }
}

// 獲取年度總結
export function getAnnualSummary(db: any, familyId: number, year: number) {
  return db.prepare(`
    SELECT * FROM plugin_butler_annual_summaries WHERE family_id = ? AND year = ?
  `).get(familyId, year);
}

// 獲取所有年度總結
export function getAllAnnualSummaries(db: any, familyId: number) {
  return db.prepare(`
    SELECT * FROM plugin_butler_annual_summaries WHERE family_id = ? ORDER BY year DESC
  `).all(familyId);
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
  createAnnouncement,
  getTodaysReminders,
  markReminderSent,
  getUpcomingReminders,
  createReminder,
  saveAnnualSummary,
  getAnnualSummary,
  getAllAnnualSummaries,
  isTodayHoliday,
};
