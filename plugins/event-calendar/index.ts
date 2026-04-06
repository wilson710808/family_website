/**
 * 事件日历插件
 * 可插拔設計，通過環境變量控制啟用/禁用
 */

import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface CalendarEvent {
  id: number;
  family_id: number;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  start_at: string;
  end_at: string | null;
  is_all_day: number;
  is_recurring: number;
  recurrence_rule: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  participants?: EventParticipant[];
}

export interface EventParticipant {
  id: number;
  event_id: number;
  user_id: number;
  status: 'pending' | 'accepted' | 'declined';
  user_name?: string;
  user_avatar?: string;
}

export type EventType = 'general' | 'birthday' | 'anniversary' | 'meeting' | 'travel' | 'reminder';

export const EVENT_TYPES: { value: EventType; label: string; icon: string; color: string }[] = [
  { value: 'general', label: '一般活動', icon: '📅', color: 'blue' },
  { value: 'birthday', label: '生日派對', icon: '🎂', color: 'pink' },
  { value: 'anniversary', label: '紀念日', icon: '💝', color: 'red' },
  { value: 'meeting', label: '家庭會議', icon: '🤝', color: 'purple' },
  { value: 'travel', label: '家庭旅遊', icon: '✈️', color: 'green' },
  { value: 'reminder', label: '提醒事項', icon: '🔔', color: 'orange' },
];

// 檢查插件是否啟用
export function isEnabled(): boolean {
  return process.env.PLUGIN_EVENT_CALENDAR !== 'false' &&
         process.env.DISABLE_PLUGIN_EVENT_CALENDAR !== 'true';
}

// 初始化數據庫
export function initDatabase(db: InstanceType<typeof Database>): void {
  if (!isEnabled()) return;

  try {
    const schemaPath = path.join(process.cwd(), 'plugins/event-calendar/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✅ 事件日曆插件數據庫初始化完成');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ 事件日曆插件數據庫已存在');
    } else {
      console.error('❌ 事件日曆插件數據庫初始化失敗:', error);
      throw error;
    }
  }
}

// 創建事件
export function createEvent(db: Database, event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_calendar_events
    (family_id, title, description, event_type, location, start_at, end_at, is_all_day, is_recurring, recurrence_rule, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    event.family_id,
    event.title,
    event.description,
    event.event_type,
    event.location,
    event.start_at,
    event.end_at,
    event.is_all_day,
    event.is_recurring,
    event.recurrence_rule,
    event.created_by
  );
  return Number(result.lastInsertRowid);
}

// 更新事件
export function updateEvent(db: Database, id: number, data: Partial<CalendarEvent>): boolean {
  const fields = Object.keys(data).filter(k => !['id', 'created_at'].includes(k));
  if (fields.length === 0) return false;

  const setClause = fields.map(k => `${k} = ?`).join(', ') + ', updated_at = CURRENT_TIMESTAMP';
  const values = fields.map(k => (data as any)[k]);
  values.push(id);

  const stmt = db.prepare(`UPDATE plugin_calendar_events SET ${setClause} WHERE id = ?`);
  return stmt.run(...values).changes > 0;
}

// 刪除事件
export function deleteEvent(db: Database, id: number): boolean {
  return db.prepare('DELETE FROM plugin_calendar_events WHERE id = ?').run(id).changes > 0;
}

// 獲取單個事件
export function getEvent(db: Database, id: number): CalendarEvent | null {
  return db.prepare(`
    SELECT e.*, u.name as created_by_name
    FROM plugin_calendar_events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.id = ?
  `).get(id) as CalendarEvent | null;
}

// 獲取家族事件（按時間範圍）
export function getFamilyEvents(db: Database, familyId: number, startDate?: string, endDate?: string): CalendarEvent[] {
  let sql = `
    SELECT e.*, u.name as created_by_name
    FROM plugin_calendar_events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.family_id = ?
  `;
  const params: any[] = [familyId];

  if (startDate) {
    sql += ' AND e.start_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND e.start_at <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY e.start_at ASC';

  return db.prepare(sql).all(...params) as CalendarEvent[];
}

// 獲取即將到來的事件
export function getUpcomingEvents(db: Database, familyId: number, limit: number = 10): CalendarEvent[] {
  return db.prepare(`
    SELECT e.*, u.name as created_by_name
    FROM plugin_calendar_events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.family_id = ? AND e.start_at >= datetime('now')
    ORDER BY e.start_at ASC
    LIMIT ?
  `).all(familyId, limit) as CalendarEvent[];
}

// 添加參與者
export function addParticipant(db: Database, eventId: number, userId: number): void {
  db.prepare(`
    INSERT OR IGNORE INTO plugin_calendar_participants (event_id, user_id)
    VALUES (?, ?)
  `).run(eventId, userId);
}

// 更新參與狀態
export function updateParticipantStatus(db: Database, eventId: number, userId: number, status: 'accepted' | 'declined'): void {
  db.prepare(`
    UPDATE plugin_calendar_participants
    SET status = ?, responded_at = CURRENT_TIMESTAMP
    WHERE event_id = ? AND user_id = ?
  `).run(status, eventId, userId);
}

// 獲取事件參與者
export function getEventParticipants(db: Database, eventId: number): EventParticipant[] {
  return db.prepare(`
    SELECT p.*, u.name as user_name, u.avatar as user_avatar
    FROM plugin_calendar_participants p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.event_id = ?
  `).all(eventId) as EventParticipant[];
}

export default {
  name: 'event-calendar',
  displayName: '事件日曆',
  description: '家族活動日曆，支持生日、紀念日、會議等',
  isEnabled,
  initDatabase,
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  getFamilyEvents,
  getUpcomingEvents,
  addParticipant,
  updateParticipantStatus,
  getEventParticipants,
};
