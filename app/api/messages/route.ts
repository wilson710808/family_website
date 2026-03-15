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

    let messages;

    if (familyId) {
      const familyIdNum = parseInt(familyId);
      if (isNaN(familyIdNum)) {
        return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
      }

      // 检查用户是否属于该家族
      const isMember = await isUserInFamily(user.id, familyIdNum);
      if (!isMember) {
        return NextResponse.json({ success: false, error: '无权访问该家族留言板' }, { status: 403 });
      }

      messages = db.prepare(`
        SELECT m.*, u.name as user_name, u.avatar as user_avatar, f.name as family_name
        FROM messages m
        JOIN users u ON m.user_id = u.id
        JOIN families f ON m.family_id = f.id
        WHERE m.family_id = ?
        ORDER BY m.created_at DESC
      `).all(familyIdNum);
    } else {
      // 获取用户所有家族的留言
      const families = await getUserFamilies(user.id);
      const familyIds = families.filter(f => f.status === 'approved').map(f => f.id);

      if (familyIds.length === 0) {
        messages = [];
      } else {
        const placeholders = familyIds.map(() => '?').join(',');
        messages = db.prepare(`
          SELECT m.*, u.name as user_name, u.avatar as user_avatar, f.name as family_name
          FROM messages m
          JOIN users u ON m.user_id = u.id
          JOIN families f ON m.family_id = f.id
          WHERE m.family_id IN (${placeholders})
          ORDER BY m.created_at DESC
        `).all(...familyIds);
      }
    }

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('获取留言接口错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
