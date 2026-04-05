/**
 * 家族管家插件 - 智能化私人家族管家
 * 可插拔設計，通過環境變量控制啟用/禁用
 */

import fs from 'fs';
import path from 'path';

import type {
  ChatMemory,
  ScheduledReminder,
  ButlerAnnouncement,
  AnnualSummary,
  ButlerConfig,
  SessionContext,
  UserPreference,
} from './types';

// 檢查插件是否啟用
export function isEnabled(): boolean {
  return process.env.PLUGIN_FAMILY_BUTLER !== 'false' &&
    process.env.DISABLE_PLUGIN_FAMILY_BUTLER !== 'true' &&
    !!process.env.NVIDIA_API_KEY;
}

// 初始化數據庫
export function initDatabase(db: any): void {
  if (!isEnabled()) return;

  try {
    const schemaPath = path.join(process.cwd(), 'plugins/family-butler/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema);
    console.log('✅ 家族管家插件數據庫初始化完成');
  } catch (error: any) {
    if (error.message.includes('table already exists')) {
      console.log('ℹ️ 家族管家插件數據庫已存在');
    } else {
      console.error('❌ 家族管家插件數據庫初始化失敗:', error);
      throw error;
    }
  }
}

// ===== 聊天記憶操作 =====

// 保存聊天記憶
export function saveChatMemory(
  db: any,
  data: {
    family_id: number;
    message_id: number;
    user_id: number;
    user_name: string;
    content: string;
  }
): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_butler_chat_memory (family_id, message_id, user_id, user_name, content)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.family_id,
    data.message_id,
    data.user_id,
    data.user_name,
    data.content
  );
  return Number(result.lastInsertRowid);
}

// 獲取家族聊天記憶分頁
export function getChatMemory(
  db: any,
  familyId: number,
  limit: number = 100,
  offset: number = 0
): ChatMemory[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_chat_memory
    WHERE family_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(familyId, limit, offset) as ChatMemory[];
}

// 獲取指定年份的所有聊天記憶
export function getChatMemoryByYear(
  db: any,
  familyId: number,
  year: number
): ChatMemory[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_chat_memory
    WHERE family_id = ? AND strftime('%Y', created_at) = ?
    ORDER BY created_at ASC
  `);
  return stmt.all(familyId, year.toString()) as ChatMemory[];
}

// ===== 會話上下文操作 =====

// 保存會話上下文
export function saveSessionContext(
  db: any,
  data: {
    family_id: number;
    session_id: string;
    user_id: number;
    user_name: string;
    role: 'user' | 'assistant';
    content: string;
  }
): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_butler_session_context (family_id, session_id, user_id, user_name, role, content)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.family_id,
    data.session_id,
    data.user_id,
    data.user_name,
    data.role,
    data.content
  );
  return Number(result.lastInsertRowid);
}

// 獲取會話上下文（最近 N 條）
export function getSessionContext(
  db: any,
  familyId: number,
  sessionId: string,
  limit: number = 20
): SessionContext[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_session_context
    WHERE family_id = ? AND session_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  const results = stmt.all(familyId, sessionId, limit) as SessionContext[];
  return results.reverse(); // 按時間正序返回
}

// 清理舊的會話上下文（保留最近 N 條）
export function cleanOldSessionContext(
  db: any,
  familyId: number,
  sessionId: string,
  keepCount: number = 50
): number {
  const stmt = db.prepare(`
    DELETE FROM plugin_butler_session_context
    WHERE family_id = ? AND session_id = ?
    AND id NOT IN (
      SELECT id FROM plugin_butler_session_context
      WHERE family_id = ? AND session_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    )
  `);
  const result = stmt.run(familyId, sessionId, familyId, sessionId, keepCount);
  return result.changes;
}

// ===== 用戶偏好操作 =====

// 保存用戶偏好
export function saveUserPreference(
  db: any,
  data: {
    family_id: number;
    user_id: number;
    preference_key: string;
    preference_value: string;
  }
): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_butler_user_preferences (family_id, user_id, preference_key, preference_value)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(family_id, user_id, preference_key) 
    DO UPDATE SET preference_value = ?, updated_at = CURRENT_TIMESTAMP
  `);
  const result = stmt.run(
    data.family_id,
    data.user_id,
    data.preference_key,
    data.preference_value,
    data.preference_value
  );
  return Number(result.lastInsertRowid);
}

// 獲取用戶偏好
export function getUserPreferences(
  db: any,
  familyId: number,
  userId: number
): UserPreference[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_user_preferences
    WHERE family_id = ? AND user_id = ?
  `);
  return stmt.all(familyId, userId) as UserPreference[];
}

// 獲取單個偏好
export function getUserPreference(
  db: any,
  familyId: number,
  userId: number,
  key: string
): string | null {
  const stmt = db.prepare(`
    SELECT preference_value FROM plugin_butler_user_preferences
    WHERE family_id = ? AND user_id = ? AND preference_key = ?
  `);
  const row = stmt.get(familyId, userId, key) as any;
  return row?.preference_value || null;
}

// ===== 提醒操作 =====

// 創建提醒
export function createReminder(
  db: any,
  data: {
    family_id: number;
    created_by: number;
    creator_name: string;
    content: string;
    remind_date: string;
    remind_time: string | null;
  }
): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_butler_scheduled_reminders (family_id, created_by, creator_name, content, remind_date, remind_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.family_id,
    data.created_by,
    data.creator_name,
    data.content,
    data.remind_date,
    data.remind_time
  );
  return Number(result.lastInsertRowid);
}

// 獲取今天需要提醒的事項
export function getTodaysReminders(db: any, today: string): ScheduledReminder[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_scheduled_reminders
    WHERE remind_date = ? AND reminded = 0
    ORDER BY remind_time ASC
  `);
  return stmt.all(today) as ScheduledReminder[];
}

// 標記提醒已發送
export function markReminderSent(db: any, id: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_butler_scheduled_reminders SET reminded = 1 WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

// 獲取家族所有未提醒
export function getUpcomingReminders(db: any, familyId: number): ScheduledReminder[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_scheduled_reminders
    WHERE family_id = ? AND reminded = 0 AND remind_date >= date('now')
    ORDER BY remind_date ASC
  `);
  return stmt.all(familyId) as ScheduledReminder[];
}

// ===== 公告操作 =====

// 創建公告
export function createAnnouncement(
  db: any,
  data: {
    family_id: number;
    user_id: number;
    creator_name: string;
    title: string;
    content: string;
    event_date: string;
    event_time: string | null;
    notify_days_before: number;
  }
): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_butler_announcements (family_id, user_id, creator_name, title, content, event_date, event_time, notify_days_before)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.family_id,
    data.user_id,
    data.creator_name,
    data.title,
    data.content,
    data.event_date,
    data.event_time,
    data.notify_days_before
  );
  return Number(result.lastInsertRowid);
}

// 獲取即將到來需要提前提醒的公告
export function getEarlyNotifications(
  db: any,
  targetDate: string
): ButlerAnnouncement[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE notified_early = 0
    AND date(event_date, '-' || notify_days_before || ' days') = ?
    ORDER BY event_date ASC
  `);
  return stmt.all(targetDate) as ButlerAnnouncement[];
}

// 獲取今天舉行的活動公告
export function getTodaysAnnouncements(db: any, today: string): ButlerAnnouncement[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE event_date = ? AND notified_today = 0
    ORDER BY event_time ASC
  `);
  return stmt.all(today) as ButlerAnnouncement[];
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
export function getUpcomingAnnouncements(
  db: any,
  familyId: number
): ButlerAnnouncement[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE family_id = ? AND event_date >= date('now')
    ORDER BY event_date ASC
  `);
  return stmt.all(familyId) as ButlerAnnouncement[];
}

// ===== 年度總結操作 =====

// 保存年度總結
export function saveAnnualSummary(
  db: any,
  familyId: number,
  year: number,
  summary: string,
  keyTopics: string[]
): number {
  // 先檢查是否已存在
  const existing = db.prepare(`
    SELECT id FROM plugin_butler_annual_summaries WHERE family_id = ? AND year = ?
  `).get(familyId, year);

  const keyTopicsJson = JSON.stringify(keyTopics);

  if (existing) {
    const result = db.prepare(`
      UPDATE plugin_butler_annual_summaries
      SET summary_content = ?, key_topics = ?, created_at = CURRENT_TIMESTAMP
      WHERE family_id = ? AND year = ?
    `).run(summary, keyTopicsJson, familyId, year);
    return Number((existing as any).id);
  } else {
    const result = db.prepare(`
      INSERT INTO plugin_butler_annual_summaries (family_id, year, summary_content, key_topics)
      VALUES (?, ?, ?, ?)
    `).run(familyId, year, summary, keyTopicsJson);
    return Number(result.lastInsertRowid);
  }
}

// 獲取年度總結
export function getAnnualSummary(
  db: any,
  familyId: number,
  year: number
): AnnualSummary | null {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_annual_summaries WHERE family_id = ? AND year = ?
  `);
  return stmt.get(familyId, year) as AnnualSummary | null;
}

// 獲取所有年度總結
export function getAllAnnualSummaries(db: any, familyId: number): AnnualSummary[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_annual_summaries WHERE family_id = ? ORDER BY year DESC
  `);
  return stmt.all(familyId) as AnnualSummary[];
}

// ===== 配置操作 =====

// 獲取家族配置
export function getFamilyConfig(db: any, familyId: number): ButlerConfig | null {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_config WHERE family_id = ?
  `);
  const row = stmt.get(familyId) as any;

  if (!row) return null;

  return {
    nvidiaApiKey: process.env.NVIDIA_API_KEY || '',
    modelName: row.model_name || 'meta/llama-3.1-8b-instruct',
    enabled: true,
    enableSentimentDetection: !!row.enable_sentiment_detection,
    enableAutoTaskDetection: !!row.enable_auto_task_detection,
    enableBirthdayGreeting: !!row.enable_birthday_greeting,
    enableHolidayGreeting: !!row.enable_holiday_greeting,
  };
}

// 檢查今天是不是節日（簡單版本，可以擴展）
// 使用台北時區 (GMT+8)
export function isTodayHoliday(): {isHoliday: boolean; name: string} {
  // 獲取台北時區的今天日期
  const today = new Date();
  // 轉換到 GMT+8 (台北時區)
  const taipeiDate = new Date(today.getTime() + 8 * 60 * 60 * 1000);
  const year = taipeiDate.getUTCFullYear();
  const month = taipeiDate.getUTCMonth() + 1;
  const date = taipeiDate.getUTCDate();
  const mmdd = `${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;

  // 主要節日列表（農曆節日需要另外處理，這裡先放公曆固定日期的）
  const holidays: Record<string, string> = {
    '01-01': '元旦',
    '02-14': '情人節',
    '05-01': '勞動節',
    '10-01': '國慶節',
    '12-25': '聖誕節',
    '01-21': '春節', // 這裡是示例，實際春節是農曆，需要後續擴展
    '09-15': '中秋節', // 示例
  };

  if (mmdd in holidays) {
    return { isHoliday: true, name: holidays[mmdd] };
  }
  return { isHoliday: false, name: '' };
}

export default {
  name: 'family-butler',
  displayName: '家族管家',
  description: '智能化私人家族管家，提供提醒、情緒引導、生日祝賀、年度總結等功能',
  isEnabled,
  initDatabase,
  saveChatMemory,
  getChatMemory,
  getChatMemoryByYear,
  saveSessionContext,
  getSessionContext,
  cleanOldSessionContext,
  saveUserPreference,
  getUserPreferences,
  getUserPreference,
  createReminder,
  getTodaysReminders,
  markReminderSent,
  getUpcomingReminders,
  createAnnouncement,
  getEarlyNotifications,
  getTodaysAnnouncements,
  markEarlyNotified,
  markTodayNotified,
  getUpcomingAnnouncements,
  saveAnnualSummary,
  getAnnualSummary,
  getAllAnnualSummaries,
  getFamilyConfig,
  isTodayHoliday,
};
