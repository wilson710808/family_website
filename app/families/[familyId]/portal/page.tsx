import { getCurrentUser, getUserFamilies } from '@/lib/auth';
import { db } from '@/lib/db';
import FamilyPortalClient from './page.client';
import { redirect } from 'next/navigation';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

async function getFamilyData(familyId: number, userId: number) {
  // 家族基本信息
  const family = db.prepare(`
    SELECT f.*, 
      (SELECT COUNT(*) FROM family_members WHERE family_id = f.id AND status = 'approved') as member_count,
      (SELECT COUNT(*) FROM messages WHERE family_id = f.id) as message_count,
      (SELECT COUNT(*) FROM announcements WHERE family_id = f.id) as announcement_count
    FROM families f WHERE f.id = ?
  `).get(familyId);

  // 成员列表
  const members = db.prepare(`
    SELECT u.id, u.name, u.avatar, fm.role, fm.relation_title, fm.contribution_points
    FROM users u
    JOIN family_members fm ON u.id = fm.user_id
    WHERE fm.family_id = ? AND fm.status = 'approved'
    ORDER BY fm.role = 'admin' DESC, fm.contribution_points DESC
  `).all(familyId);

  // 最新公告
  const announcements = db.prepare(`
    SELECT a.*, u.name as author_name
    FROM announcements a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.family_id = ?
    ORDER BY a.created_at DESC
    LIMIT 5
  `).all(familyId);

  // 最新消息
  const messages = db.prepare(`
    SELECT m.*, u.name as author_name, u.avatar as author_avatar
    FROM messages m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.family_id = ?
    ORDER BY m.created_at DESC
    LIMIT 10
  `).all(familyId);

  // 即将到来的事件
  let upcomingEvents: any[] = [];
  try {
    upcomingEvents = db.prepare(`
      SELECT * FROM plugin_calendar_events
      WHERE family_id = ? AND start_time >= datetime('now')
      ORDER BY start_time ASC
      LIMIT 5
    `).all(familyId);
  } catch {}

  // 即将到来的生日
  let upcomingBirthdays: any[] = [];
  try {
    upcomingBirthdays = db.prepare(`
      SELECT u.id, u.name, u.avatar, b.date,
        CASE 
          WHEN strftime('%m-%d', b.date) >= strftime('%m-%d', 'now') THEN strftime('%Y', 'now') || '-' || strftime('%m-%d', b.date)
          ELSE (CAST(strftime('%Y', 'now') AS INTEGER) + 1) || '-' || strftime('%m-%d', b.date)
        END as next_birthday
      FROM plugin_birthday_settings b
      JOIN users u ON b.user_id = u.id
      JOIN family_members fm ON u.id = fm.user_id
      WHERE fm.family_id = ? AND fm.status = 'approved' AND b.notify_days > 0
      ORDER BY next_birthday ASC
      LIMIT 5
    `).all(familyId);
  } catch {}

  // 用户未读消息数
  const unreadCount = db.prepare(`
    SELECT COUNT(*) FROM messages m
    WHERE m.family_id = ? AND m.user_id != ?
    AND m.id NOT IN (
      SELECT message_id FROM chat_message_reads WHERE user_id = ?
    )
  `).pluck().get(familyId, userId, userId) as number;

  return {
    family,
    members,
    announcements,
    messages,
    upcomingEvents,
    upcomingBirthdays,
    unreadCount,
  };
}

export default async function FamilyPortalPage({ params }: { params: { familyId: string } }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const familyId = Number(params.familyId);
  const families = await getUserFamilies(user.id);
  const approvedFamilies = families.filter(f => f.status === 'approved');

  // 检查用户是否是家族成员
  const isMember = approvedFamilies.some(f => f.id === familyId);
  if (!isMember && approvedFamilies.length > 0) {
    redirect(`/families/${approvedFamilies[0].id}`);
  }

  const data = await getFamilyData(familyId, user.id);

  return (
    <FamilyPortalClient
      user={user}
      families={approvedFamilies}
      currentFamilyId={familyId}
      data={data}
    />
  );
}
