import { getCurrentUser, getUserFamilies } from '@/lib/auth';
import { db } from '@/lib/db';
import StatsClient from './page.client';
import { redirect } from 'next/navigation';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

async function getStatsData(familyId: number) {
  // 综合概览
  const totalMessages = db.prepare(`
    SELECT COUNT(*) as count FROM messages WHERE family_id = ?
  `).pluck().get(familyId) as number;

  const totalAnnouncements = db.prepare(`
    SELECT COUNT(*) as count FROM announcements WHERE family_id = ?
  `).pluck().get(familyId) as number;

  let totalEvents = 0;
  try {
    totalEvents = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_calendar_events WHERE family_id = ?
    `).pluck().get(familyId) as number;
  } catch {}

  let totalPhotos = 0;
  try {
    totalPhotos = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_album_photos WHERE family_id = ?
    `).pluck().get(familyId) as number;
  } catch {}

  const memberCount = db.prepare(`
    SELECT COUNT(*) as count FROM family_members WHERE family_id = ? AND status = 'approved'
  `).pluck().get(familyId) as number;

  // 最近30天活跃度
  const activity = db.prepare(`
    SELECT 
      date(created_at) as stat_date,
      COUNT(*) as message_count,
      COUNT(DISTINCT user_id) as active_members
    FROM messages
    WHERE family_id = ? AND created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY stat_date ASC
  `).all(familyId);

  // 贡献排行
  const ranking = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar,
      fm.contribution_points,
      fm.contribution_stars,
      (SELECT COUNT(*) FROM messages WHERE user_id = u.id AND family_id = ?) as message_count,
      (SELECT COUNT(*) FROM announcements WHERE user_id = u.id AND family_id = ?) as announcement_count
    FROM users u
    JOIN family_members fm ON u.id = fm.user_id
    WHERE fm.family_id = ? AND fm.status = 'approved'
    ORDER BY fm.contribution_points DESC, message_count DESC
    LIMIT 10
  `).all(familyId, familyId, familyId);

  return {
    overview: {
      totalMessages,
      totalAnnouncements,
      totalEvents,
      totalPhotos,
      memberCount,
    },
    activity,
    ranking,
  };
}

export default async function StatsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const families = await getUserFamilies(user.id);
  const approvedFamilies = families.filter(f => f.status === 'approved');

  let statsData = null;
  if (approvedFamilies.length > 0) {
    statsData = await getStatsData(approvedFamilies[0].id);
  }

  return (
    <StatsClient
      user={user}
      families={approvedFamilies}
      initialStats={statsData}
      initialFamilyId={approvedFamilies[0]?.id}
    />
  );
}
