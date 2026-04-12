import { getCurrentUser, getUserFamilies } from '@/lib/auth';
import { db } from '@/lib/db';
import NotificationsClient from './page.client';
import { redirect } from 'next/navigation';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // 获取用户所有家族的通知
  const families = await getUserFamilies(user.id);
  const familyIds = families.filter(f => f.status === 'approved').map(f => f.id);

  let notifications: any[] = [];
  
  if (familyIds.length > 0) {
    const placeholders = familyIds.map(() => '?').join(',');
    try {
      notifications = db.prepare(`
        SELECT n.*, f.name as family_name
        FROM plugin_notifications n
        JOIN families f ON n.family_id = f.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT 100
      `).all(user.id) as any[];
    } catch (error) {
      console.error('获取通知失败:', error);
    }
  }

  return (
    <NotificationsClient
      user={user}
      initialNotifications={notifications}
    />
  );
}
