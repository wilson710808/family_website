import { getCurrentUser, getUserFamilies } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardClient from './page.client';
import { redirect } from 'next/navigation';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

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

  // 合并并按时间排序
  const allActivities = [...announcements, ...messages].sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 10);

  return allActivities;
}

function getStats(approvedFamilies: any[]) {
  let totalAnnouncements = 0;
  let totalMessages = 0;

  if (approvedFamilies.length > 0) {
    const familyIds = approvedFamilies.map(f => f.id);
    const placeholders = familyIds.map(() => '?').join(',');
    
    const resultAnnouncements = db.prepare(`SELECT COUNT(*) as count FROM announcements WHERE family_id IN (${placeholders})`).pluck().get(...familyIds);
    totalAnnouncements = typeof resultAnnouncements === 'number' ? resultAnnouncements : 0;
    
    const resultMessages = db.prepare(`SELECT COUNT(*) as count FROM messages WHERE family_id IN (${placeholders})`).pluck().get(...familyIds);
    totalMessages = typeof resultMessages === 'number' ? resultMessages : 0;
  }

  return { totalAnnouncements, totalMessages };
}

export default async function DashboardPage() {
  // 完全移除认证检查 - 始终使用默认管理员用户
  const user = await getCurrentUser();
  const families = await getUserFamilies(user.id);
  const approvedFamilies = families.filter(f => f.status === 'approved');
  const pendingInvitations = families.filter(f => f.status === 'pending');
  const recentActivities = await getRecentActivities(user.id);
  const stats = getStats(approvedFamilies);

  return (
    <DashboardClient 
      user={user} 
      approvedFamilies={approvedFamilies} 
      pendingInvitations={pendingInvitations} 
      recentActivities={recentActivities}
      stats={stats}
    />
  );
}
