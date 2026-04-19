import { getCurrentUser, getUserFamilies } from '@/lib/auth';
import { db } from '@/lib/db';
import PersonalHomeClient from './page.client';
import { redirect } from 'next/navigation';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

async function getPersonalStats(userId: number) {
  const families = await getUserFamilies(userId);
  const approvedFamilies = families.filter(f => f.status === 'approved');
  const familyIds = approvedFamilies.map(f => f.id);

  if (familyIds.length === 0) {
    return {
      totalFamilies: 0,
      totalMessages: 0,
      totalAnnouncements: 0,
      upcomingBirthdays: 0,
      upcomingEvents: 0,
      unreadNotifications: 0,
      growthBooksRead: 0,
      growthBooksFavorited: 0,
    };
  }

  const placeholders = familyIds.map(() => '?').join(',');

  // 统计消息数
  const totalMessages = db.prepare(`
    SELECT COUNT(*) as count FROM messages WHERE family_id IN (${placeholders})
  `).pluck().get(...familyIds) as number;

  // 统计公告数
  const totalAnnouncements = db.prepare(`
    SELECT COUNT(*) as count FROM announcements WHERE family_id IN (${placeholders})
  `).pluck().get(...familyIds) as number;

  // 即将到来的生日（未来30天内）
  const upcomingBirthdays = db.prepare(`
    SELECT COUNT(*) as count FROM plugin_birthday_reminders
    WHERE family_id IN (${placeholders})
    AND is_enabled = 1
    AND date(birth_date) >= date('now')
    AND date(birth_date) <= date('now', '+30 days')
  `).pluck().get(...familyIds) as number;

  // 即将到来的日历事件（未来7天内）
  let upcomingEvents = 0;
  try {
    upcomingEvents = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_calendar_events
      WHERE family_id IN (${placeholders})
      AND datetime(start_at) >= datetime('now')
      AND datetime(start_at) <= datetime('now', '+7 days')
    `).pluck().get(...familyIds) as number;
  } catch {}

  // 未读通知数
  let unreadNotifications = 0;
  try {
    unreadNotifications = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_notifications
      WHERE user_id = ? AND is_read = 0
    `).pluck().get(userId) as number;
  } catch {}

  // 成长专栏统计
  let growthBooksRead = 0;
  let growthBooksFavorited = 0;
  try {
    growthBooksRead = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_growth_book_history WHERE user_id = ?
    `).pluck().get(userId) as number;
    
    growthBooksFavorited = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_growth_book_favorites WHERE user_id = ?
    `).pluck().get(userId) as number;
  } catch {}

  return {
    totalFamilies: approvedFamilies.length,
    totalMessages,
    totalAnnouncements,
    upcomingBirthdays,
    upcomingEvents,
    unreadNotifications,
    growthBooksRead,
    growthBooksFavorited,
  };
}

async function getRecentActivities(userId: number) {
  const families = await getUserFamilies(userId);
  const familyIds = families.filter(f => f.status === 'approved').map(f => f.id);
  if (familyIds.length === 0) return [];

  const placeholders = familyIds.map(() => '?').join(',');

  // 获取最近的公告
  const announcements = db.prepare(`
    SELECT a.*, u.name as user_name, 'announcement' as type
    FROM announcements a
    JOIN users u ON a.user_id = u.id
    WHERE a.family_id IN (${placeholders})
    ORDER BY a.created_at DESC
    LIMIT 5
  `).all(...familyIds);

  // 获取最近的留言
  const messages = db.prepare(`
    SELECT m.*, u.name as user_name, 'message' as type
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.family_id IN (${placeholders})
    ORDER BY m.created_at DESC
    LIMIT 5
  `).all(...familyIds);

  // 获取即将到来的日历事件
  let calendarEvents: any[] = [];
  try {
    calendarEvents = db.prepare(`
      SELECT e.*, u.name as user_name, 'event' as type
      FROM plugin_calendar_events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.family_id IN (${placeholders})
      AND e.start_at >= datetime('now')
      ORDER BY e.start_at ASC
      LIMIT 5
    `).all(...familyIds) as any[];
  } catch {}

  // 合并并按时间排序
  const allActivities = [...announcements, ...messages, ...calendarEvents].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 10);

  return allActivities;
}

async function getUpcomingItems(userId: number) {
  const families = await getUserFamilies(userId);
  const approvedFamilies = families.filter(f => f.status === 'approved');
  const familyIds = approvedFamilies.map(f => f.id);
  if (familyIds.length === 0) return { birthdays: [], events: [] };

  const placeholders = familyIds.map(() => '?').join(',');

  // 即将到来的生日提醒
  let birthdays: any[] = [];
  try {
    birthdays = db.prepare(`
      SELECT b.*, f.name as family_name
      FROM plugin_birthday_reminders b
      JOIN families f ON b.family_id = f.id
      WHERE b.family_id IN (${placeholders})
      AND b.is_enabled = 1
      AND date(b.birth_date) >= date('now')
      AND date(b.birth_date) <= date('now', '+30 days')
      ORDER BY b.birth_date ASC
      LIMIT 5
    `).all(...familyIds) as any[];
  } catch {}

  // 即将到来的事件
  let events: any[] = [];
  try {
    events = db.prepare(`
      SELECT e.*, f.name as family_name
      FROM plugin_calendar_events e
      JOIN families f ON e.family_id = f.id
      WHERE e.family_id IN (${placeholders})
      AND e.start_at >= datetime('now')
      ORDER BY e.start_at ASC
      LIMIT 5
    `).all(...familyIds) as any[];
  } catch {}

  return { birthdays, events };
}

export default async function PersonalHomePage() {
  const user = await getCurrentUser();

  // 未登录重定向到登录页
  if (!user) {
    redirect('/login');
  }

  const families = await getUserFamilies(user.id);
  const approvedFamilies = families.filter(f => f.status === 'approved');
  const pendingInvitations = families.filter(f => f.status === 'pending');
  const stats = await getPersonalStats(user.id);
  const recentActivities = await getRecentActivities(user.id);
  const upcomingItems = await getUpcomingItems(user.id);

  return (
    <PersonalHomeClient
      user={user}
      approvedFamilies={approvedFamilies}
      pendingInvitations={pendingInvitations}
      stats={stats}
      recentActivities={recentActivities}
      upcomingItems={upcomingItems}
    />
  );
}
