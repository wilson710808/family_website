/**
 * 生日/纪念日提醒插件
 * 可插拔设计 - 通过 PLUGIN_BIRTHDAY_ENABLED 环境变量控制开关
 * 默认启用，设置 DISABLED=1 即可禁用
 */

import { db } from '../../lib/db';

export interface BirthdayReminder {
  id: number;
  user_id: number;
  family_id: number;
  reminder_type: 'birthday' | 'anniversary' | 'custom';
  title: string;
  birth_date: string; // MM-DD or YYYY-MM-DD
  year: number | null;
  is_enabled: number;
  created_at: string;
}

export interface BirthdaySettings {
  id: number;
  family_id: number;
  user_id: number;
  remind_days_before: number;
  notify_on_birthday_day: number;
  is_enabled: number;
  created_at: string;
}

export interface UpcomingReminder {
  id: number;
  user_id: number;
  family_id: number;
  reminder_type: 'birthday' | 'anniversary' | 'custom';
  title: string;
  birth_date: string;
  year: number | null;
  daysUntil: number;
  age: number | null;
}

// 检查插件是否启用
export function isEnabled(): boolean {
  return process.env.PLUGIN_BIRTHDAY_REMINDER !== 'false' && 
         process.env.PLUGIN_BIRTHDAY_REMINDER !== '0' &&
         process.env.DISABLE_PLUGIN_BIRTHDAY !== '1' &&
         process.env.DISABLE_PLUGIN_BIRTHDAY !== 'true';
}

// 初始化数据库表
export function initDatabase() {
  if (!isEnabled()) return;
  
  try {
    // 检查表是否存在
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='plugin_birthday_reminders'
    `).get();
    
    if (!tableExists) {
      // 使用绝对路径避免构建时大小写问题
      const schemaPath = '/root/.openclaw/workspace/family-portal/plugins/birthday-reminder/schema.sql';
      const schema = require('fs').readFileSync(schemaPath, 'utf8');
      db.exec(schema);
      console.log('[BirthdayReminderPlugin] 数据库初始化完成');
    }
  } catch (error) {
    console.error('[BirthdayReminderPlugin] 初始化失败:', error);
  }
}

// 添加提醒
export function addReminder(reminder: Omit<BirthdayReminder, 'id' | 'created_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO plugin_birthday_reminders 
    (user_id, family_id, reminder_type, title, birth_date, year, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    reminder.user_id,
    reminder.family_id,
    reminder.reminder_type,
    reminder.title,
    reminder.birth_date,
    reminder.year,
    reminder.is_enabled
  );
  return Number(result.lastInsertRowid);
}

// 更新提醒
export function updateReminder(
  id: number,
  data: Partial<Omit<BirthdayReminder, 'id' | 'created_at'>>
): boolean {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE plugin_birthday_reminders SET ${fields} WHERE id = ?
  `);
  const result = stmt.run(values);
  return result.changes > 0;
}

// 删除提醒
export function deleteReminder(id: number): boolean {
  const stmt = db.prepare('DELETE FROM plugin_birthday_reminders WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// 获取家族所有提醒
export function getFamilyReminders(familyId: number): BirthdayReminder[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_birthday_reminders 
    WHERE family_id = ? AND is_enabled = 1
    ORDER BY birth_date
  `);
  return stmt.all(familyId) as BirthdayReminder[];
}

// 获取用户提醒
export function getUserReminders(userId: number, familyId: number): BirthdayReminder[] {
  const stmt = db.prepare(`
    SELECT * FROM plugin_birthday_reminders 
    WHERE user_id = ? AND family_id = ? AND is_enabled = 1
    ORDER BY birth_date
  `);
  return stmt.all(userId, familyId) as BirthdayReminder[];
}

// 获取用户设置
export function getUserSettings(familyId: number, userId: number): BirthdaySettings | null {
  const stmt = db.prepare(`
    SELECT * FROM plugin_birthday_settings 
    WHERE family_id = ? AND user_id = ?
  `);
  return stmt.get(familyId, userId) as BirthdaySettings | null;
}

// 设置用户设置
export function setUserSettings(
  familyId: number, 
  userId: number, 
  settings: { remind_days_before: number; notify_on_birthday_day: number; is_enabled: number }
): void {
  const existing = getUserSettings(familyId, userId);
  
  if (existing) {
    db.prepare(`
      UPDATE plugin_birthday_settings 
      SET remind_days_before = ?, notify_on_birthday_day = ?, is_enabled = ?
      WHERE family_id = ? AND user_id = ?
    `).run(
      settings.remind_days_before,
      settings.notify_on_birthday_day,
      settings.is_enabled,
      familyId,
      userId
    );
  } else {
    db.prepare(`
      INSERT INTO plugin_birthday_settings 
      (family_id, user_id, remind_days_before, notify_on_birthday_day, is_enabled)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      familyId,
      userId,
      settings.remind_days_before,
      settings.notify_on_birthday_day,
      settings.is_enabled
    );
  }
}

// 计算距离生日还有多少天
function calculateDaysUntil(targetMmDd: string): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [mm, dd] = targetMmDd.split('-').map(Number);
  
  let targetDate = new Date(currentYear, mm - 1, dd);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // 如果今年的已经过了，算明年的
  if (targetDate < todayStart) {
    targetDate = new Date(currentYear + 1, mm - 1, dd);
  }
  
  const diffTime = targetDate.getTime() - todayStart.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 计算年龄/周年
function calculateAge(year: number | null): number | null {
  if (!year) return null;
  const currentYear = new Date().getFullYear();
  return currentYear - year;
}

// 获取即将到来的提醒（用于首页展示）
export function getUpcomingReminders(familyId: number, daysAhead: number = 30): UpcomingReminder[] {
  if (!isEnabled()) return [];
  
  const reminders = getFamilyReminders(familyId);
  const today = new Date();
  const result: UpcomingReminder[] = [];
  
  for (const reminder of reminders) {
    // 获取 MM-DD 格式
    let mmdd = reminder.birth_date;
    if (mmdd.length === 10) { // YYYY-MM-DD
      mmdd = mmdd.slice(-5);
    }
    
    const daysUntil = calculateDaysUntil(mmdd);
    if (daysUntil <= daysAhead) {
      result.push({
        id: reminder.id,
        user_id: reminder.user_id,
        family_id: reminder.family_id,
        reminder_type: reminder.reminder_type,
        title: reminder.title,
        birth_date: reminder.birth_date,
        year: reminder.year,
        daysUntil,
        age: calculateAge(reminder.year)
      });
    }
  }
  
  // 按天数排序，最近的在前
  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

// 获取今天生日的提醒
export function getTodaysBirthdays(familyId: number): UpcomingReminder[] {
  const today = new Date();
  const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const reminders = getFamilyReminders(familyId);
  return reminders
    .filter(r => {
      const rMmDd = r.birth_date.length === 10 ? r.birth_date.slice(-5) : r.birth_date;
      return rMmDd === mmdd;
    })
    .map(r => ({
      id: r.id,
      user_id: r.user_id,
      family_id: r.family_id,
      reminder_type: r.reminder_type,
      title: r.title,
      birth_date: r.birth_date,
      year: r.year,
      daysUntil: 0,
      age: calculateAge(r.year)
    }));
}

export default {
  isEnabled,
  initDatabase,
  addReminder,
  updateReminder,
  deleteReminder,
  getFamilyReminders,
  getUserReminders,
  getUserSettings,
  setUserSettings,
  getUpcomingReminders,
  getTodaysBirthdays
};
