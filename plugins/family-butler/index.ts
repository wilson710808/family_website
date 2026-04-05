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

// ============ 管家回覆保存（用戶可查看歷史） ============

// 保存管家回覆
export function saveButlerReply(db: any, data: {
  family_id: number;
  message_id: number;
  content: string;
  trigger_type?: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_butler_replies (family_id, message_id, content, trigger_type)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(data.family_id, data.message_id, data.content, data.trigger_type || 'auto');
  return Number(result.lastInsertRowid);
}

// 獲取管家歷史回覆（用戶可查看）
export function getButlerReplies(db: any, familyId: number, limit: number = 50): any[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_replies
    WHERE family_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(familyId, limit) as any[];
}

// ============ 每日摘要操作 ============

// 保存每日摘要
export function saveDailySummary(db: any, data: {
  family_id: number;
  summary_date: string;
  summary_text: string;
  key_topics: string[];
  key_members: string[];
  mood_score: number;
}): number {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO plugin_butler_daily_summaries
    (family_id, summary_date, summary_text, key_topics, key_members, mood_score)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.family_id,
    data.summary_date,
    data.summary_text,
    JSON.stringify(data.key_topics),
    JSON.stringify(data.key_members),
    data.mood_score
  );
  return Number(result.lastInsertRowid);
}

// 獲取最近 N 天的摘要
export function getRecentDailySummaries(db: any, familyId: number, days: number = 7): any[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_daily_summaries
    WHERE family_id = ?
    ORDER BY summary_date DESC
    LIMIT ?
  `);
  return stmt.all(familyId, days) as any[];
}

// 獲取指定日期的摘要
export function getDailySummary(db: any, familyId: number, date: string): any {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_daily_summaries
    WHERE family_id = ? AND summary_date = ?
  `);
  return stmt.get(familyId, date);
}

// ============ 家庭成員畫像操作 ============

// 更新成員畫像
export function updateMemberProfile(db: any, data: {
  family_id: number;
  user_id: number;
  user_name: string;
  personality_traits?: string[];
  concerns?: string[];
  achievements?: string[];
  preferences?: Record<string, string>;
}): void {
  const existing = db.prepare(`
    SELECT id FROM plugin_butler_member_profiles
    WHERE family_id = ? AND user_id = ?
  `).get(data.family_id, data.user_id);

  const traitsJson = JSON.stringify(data.personality_traits || []);
  const concernsJson = JSON.stringify(data.concerns || []);
  const achievementsJson = JSON.stringify(data.achievements || []);
  const prefsJson = JSON.stringify(data.preferences || {});
  const today = new Date().toISOString().split('T')[0];

  if (existing) {
    db.prepare(`
      UPDATE plugin_butler_member_profiles
      SET user_name = ?, personality_traits = ?, concerns = ?, achievements = ?, preferences = ?, last_updated = ?
      WHERE family_id = ? AND user_id = ?
    `).run(data.user_name, traitsJson, concernsJson, achievementsJson, prefsJson, today, data.family_id, data.user_id);
  } else {
    db.prepare(`
      INSERT INTO plugin_butler_member_profiles
      (family_id, user_id, user_name, personality_traits, concerns, achievements, preferences, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.family_id, data.user_id, data.user_name, traitsJson, concernsJson, achievementsJson, prefsJson, today);
  }
}

// 獲取成員畫像
export function getMemberProfile(db: any, familyId: number, userId: number): any {
  return db.prepare(`
    SELECT * FROM plugin_butler_member_profiles
    WHERE family_id = ? AND user_id = ?
  `).get(familyId, userId);
}

// 獲取家庭所有成員畫像
export function getFamilyMemberProfiles(db: any, familyId: number): any[] {
  return db.prepare(`
    SELECT * FROM plugin_butler_member_profiles
    WHERE family_id = ?
  `).all(familyId) as any[];
}

// ============ 聊天記憶操作 ============

// 保存聊天消息
export function saveChatMessage(db: any, data: {
  family_id: number;
  message_id: number;
  user_id: number;
  user_name: string;
  content: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_butler_chat_memory (family_id, message_id, user_id, user_name, content)
    VALUES (?, ?, ?, ?, ?)
  `);
  return Number(stmt.run(data.family_id, data.message_id, data.user_id, data.user_name, data.content).lastInsertRowid);
}

// 獲取當天聊天消息
export function getTodayChatMessages(db: any, familyId: number): any[] {
  return db.prepare(`
    SELECT * FROM plugin_butler_chat_memory
    WHERE family_id = ? AND date(created_at) = date('now')
    ORDER BY created_at ASC
  `).all(familyId) as any[];
}

// 獲取最近 N 條聊天消息
export function getRecentChatMessages(db: any, familyId: number, limit: number = 100): any[] {
  return db.prepare(`
    SELECT * FROM plugin_butler_chat_memory
    WHERE family_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(familyId, limit) as any[];
}

// 標記消息已摘要
export function markMessagesSummarized(db: any, familyId: number, messageIds: number[]): void {
  const placeholders = messageIds.map(() => '?').join(',');
  db.prepare(`
    UPDATE plugin_butler_chat_memory
    SET is_summarized = 1
    WHERE family_id = ? AND message_id IN (${placeholders})
  `).run(familyId, ...messageIds);
}

// ============ 公告操作 ============

export function getEarlyNotifications(db: any, targetDate: string) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE notified_early = 0
    AND date(event_date, '-' || notify_days_before || ' days') = ?
    ORDER BY event_date ASC
  `);
  return stmt.all(targetDate) as any[];
}

export function getTodaysAnnouncements(db: any, today: string) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE event_date = ? AND notified_today = 0
    ORDER BY event_time ASC
  `);
  return stmt.all(today) as any[];
}

export function markEarlyNotified(db: any, id: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_butler_announcements SET notified_early = 1 WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

export function markTodayNotified(db: any, id: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_butler_announcements SET notified_today = 1 WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

export function getUpcomingAnnouncements(db: any, familyId: number) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_announcements
    WHERE family_id = ? AND event_date >= date('now')
    ORDER BY event_date ASC
  `);
  return stmt.all(familyId) as any[];
}

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

export function getTodaysReminders(db: any, today: string) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_scheduled_reminders
    WHERE remind_date = ? AND reminded = 0
    ORDER BY remind_time ASC
  `);
  return stmt.all(today) as any[];
}

export function markReminderSent(db: any, id: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_butler_scheduled_reminders SET reminded = 1 WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

export function getUpcomingReminders(db: any, familyId: number) {
  const stmt = db.prepare(`
    SELECT * FROM plugin_butler_scheduled_reminders
    WHERE family_id = ? AND reminded = 0 AND remind_date >= date('now')
    ORDER BY remind_date ASC
  `);
  return stmt.all(familyId) as any[];
}

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

// ============ 年度總結操作 ============

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

export function getAnnualSummary(db: any, familyId: number, year: number) {
  return db.prepare(`
    SELECT * FROM plugin_butler_annual_summaries WHERE family_id = ? AND year = ?
  `).get(familyId, year);
}

export function getAllAnnualSummaries(db: any, familyId: number) {
  return db.prepare(`
    SELECT * FROM plugin_butler_annual_summaries WHERE family_id = ? ORDER BY year DESC
  `).all(familyId);
}

export function getChatMemory(db: any, familyId: number, limit: number = 100) {
  return db.prepare(`
    SELECT * FROM plugin_butler_chat_memory
    WHERE family_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(familyId, limit);
}

export function getChatMemoryByYear(db: any, familyId: number, year: number) {
  return db.prepare(`
    SELECT * FROM plugin_butler_chat_memory
    WHERE family_id = ? AND strftime('%Y', created_at) = ?
    ORDER BY created_at ASC
  `).all(familyId, year.toString());
}

// ============ 節日檢測 ============

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
  // 管家回覆
  saveButlerReply,
  getButlerReplies,
  // 每日摘要
  saveDailySummary,
  getRecentDailySummaries,
  getDailySummary,
  // 成員畫像
  updateMemberProfile,
  getMemberProfile,
  getFamilyMemberProfiles,
  // 聊天記憶
  saveChatMessage,
  getTodayChatMessages,
  getRecentChatMessages,
  markMessagesSummarized,
  // 公告
  getEarlyNotifications,
  getTodaysAnnouncements,
  markEarlyNotified,
  markTodayNotified,
  getUpcomingAnnouncements,
  createAnnouncement,
  // 提醒
  getTodaysReminders,
  markReminderSent,
  getUpcomingReminders,
  createReminder,
  // 年度總結
  saveAnnualSummary,
  getAnnualSummary,
  getAllAnnualSummaries,
  getChatMemory,
  getChatMemoryByYear,
  // 節日
  isTodayHoliday,
};
