import { NextResponse } from 'next/server';
import { getCurrentUser, getUserFamilies, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    let announcements: any[] = [];

    if (familyId) {
      const familyIdNum = parseInt(familyId);
      if (isNaN(familyIdNum)) {
        return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
      }

      // 检查用户是否属于该家族
      const isMember = await isUserInFamily(user.id, familyIdNum);
      if (!isMember) {
        return NextResponse.json({ success: false, error: '无权访问该家族公告' }, { status: 403 });
      }

      announcements = db.prepare(`
        SELECT a.*, u.name as user_name, f.name as family_name
        FROM announcements a
        JOIN users u ON a.user_id = u.id
        JOIN families f ON a.family_id = f.id
        WHERE a.family_id = ?
        ORDER BY a.created_at DESC
      `).all(familyIdNum);
    } else {
      // 获取用户所有家族的公告
      const families = await getUserFamilies(user.id);
      const familyIds = families.filter(f => f.status === 'approved').map(f => f.id);

      if (familyIds.length === 0) {
        announcements = [];
      } else {
        const placeholders = familyIds.map(() => '?').join(',');
        announcements = db.prepare(`
          SELECT a.*, u.name as user_name, f.name as family_name
          FROM announcements a
          JOIN users u ON a.user_id = u.id
          JOIN families f ON a.family_id = f.id
          WHERE a.family_id IN (${placeholders})
          ORDER BY a.created_at DESC
        `).all(...familyIds);
      }
    }

    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error('获取公告接口错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
