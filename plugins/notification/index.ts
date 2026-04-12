/**
 * 通知系统插件
 * 提供统一的通知管理功能
 */
import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export type NotificationType = 'birthday' | 'event' | 'message' | 'announcement' | 'reminder' | 'system';

export interface Notification {
  id: number;
  family_id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  content: string | null;
  link: string | null;
  is_read: number;
  created_at: string;
  read_at: string | null;
}

export interface NotificationSettings {
  id: number;
  family_id: number;
  user_id: number;
  notify_birthday: number;
  notify_event: number;
  notify_message: number;
  notify_announcement: number;
  notify_reminder: number;
  push_enabled: number;
  email_enabled: number;
}

// 檢查插件是否啟用
export function isEnabled(): boolean {
  return process.env.PLUGIN_NOTIFICATION !== 'false' && process.env.DISABLE_PLUGIN_NOTIFICATION !== 'true';
}

// 初始化數據庫
export function initDatabase(db: Database.Database): void {
  if (!isEnabled()) return;
  try {
    const schemaPath = path.join(process.cwd(), 'plugins/notification/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✅ 通知系統插件數據庫初始化完成');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ 通知系統插件數據庫已存在');
    } else {
      console.error('❌ 通知系統插件數據庫初始化失敗:', error);
      throw error;
    }
  }
}

// 創建通知
export function createNotification(db: Database.Database, data: {
  family_id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  content?: string;
  link?: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_notifications (family_id, user_id, type, title, content, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.family_id,
    data.user_id,
    data.type,
    data.title,
    data.content || null,
    data.link || null
  );
  return Number(result.lastInsertRowid);
}

// 批量創建通知（發送給家族所有成員）
export function createNotificationForFamily(db: Database.Database, data: {
  family_id: number;
  type: NotificationType;
  title: string;
  content?: string;
  link?: string;
  excludeUserId?: number;
}): number[] {
  // 獲取家族所有成員
  const members = db.prepare(`
    SELECT user_id FROM family_members WHERE family_id = ? AND status = 'approved'
  `).all(data.family_id) as { user_id: number }[];

  const notificationIds: number[] = [];
  for (const member of members) {
    if (data.excludeUserId && member.user_id === data.excludeUserId) continue;
    const id = createNotification(db, {
      family_id: data.family_id,
      user_id: member.user_id,
      type: data.type,
      title: data.title,
      content: data.content,
      link: data.link,
    });
    notificationIds.push(id);
  }
  return notificationIds;
}

// 獲取用戶未讀通知
export function getUnreadNotifications(db: Database.Database, userId: number, limit: number = 20): Notification[] {
  return db.prepare(`
    SELECT * FROM plugin_notifications
    WHERE user_id = ? AND is_read = 0
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit) as Notification[];
}

// 獲取用戶所有通知
export function getNotifications(db: Database.Database, userId: number, limit: number = 50): Notification[] {
  return db.prepare(`
    SELECT * FROM plugin_notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit) as Notification[];
}

// 獲取未讀通知數量
export function getUnreadCount(db: Database.Database, userId: number): number {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM plugin_notifications
    WHERE user_id = ? AND is_read = 0
  `).get(userId) as { count: number };
  return result.count;
}

// 標記通知為已讀
export function markAsRead(db: Database.Database, notificationId: number, userId: number): boolean {
  const result = db.prepare(`
    UPDATE plugin_notifications
    SET is_read = 1, read_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(notificationId, userId);
  return result.changes > 0;
}

// 標記所有通知為已讀
export function markAllAsRead(db: Database.Database, userId: number): number {
  const result = db.prepare(`
    UPDATE plugin_notifications
    SET is_read = 1, read_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND is_read = 0
  `).run(userId);
  return result.changes;
}

// 刪除通知
export function deleteNotification(db: Database.Database, notificationId: number, userId: number): boolean {
  const result = db.prepare(`
    DELETE FROM plugin_notifications WHERE id = ? AND user_id = ?
  `).run(notificationId, userId);
  return result.changes > 0;
}

// 獲取通知設置
export function getNotificationSettings(db: Database.Database, familyId: number, userId: number): NotificationSettings | null {
  return db.prepare(`
    SELECT * FROM plugin_notification_settings WHERE family_id = ? AND user_id = ?
  `).get(familyId, userId) as NotificationSettings | null;
}

// 更新通知設置
export function updateNotificationSettings(db: Database.Database, familyId: number, userId: number, settings: Partial<NotificationSettings>): boolean {
  const existing = getNotificationSettings(db, familyId, userId);
  
  if (existing) {
    const fields = Object.keys(settings).filter(k => !['id', 'family_id', 'user_id', 'created_at'].includes(k));
    if (fields.length === 0) return false;
    
    const setClause = fields.map(k => `${k} = ?`).join(', ') + ', updated_at = CURRENT_TIMESTAMP';
    const values = fields.map(k => (settings as any)[k]);
    values.push(familyId, userId);
    
    const result = db.prepare(`
      UPDATE plugin_notification_settings SET ${setClause} WHERE family_id = ? AND user_id = ?
    `).run(...values);
    return result.changes > 0;
  } else {
    db.prepare(`
      INSERT INTO plugin_notification_settings (family_id, user_id, notify_birthday, notify_event, notify_message, notify_announcement, notify_reminder)
      VALUES (?, ?, 1, 1, 1, 1, 1)
    `).run(familyId, userId);
    return true;
  }
}

export default {
  name: 'notification',
  displayName: '通知系統',
  description: '統一的通知管理功能',
  isEnabled,
  initDatabase,
  createNotification,
  createNotificationForFamily,
  getUnreadNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
};
