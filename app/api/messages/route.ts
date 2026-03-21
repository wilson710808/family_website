import { NextResponse } from 'next/server';
import { getCurrentUser, getUserFamilies, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 完全移除认证检查 - 允许所有人访问
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    let messages: any[] = [];

    if (familyId) {
      const familyIdNum = parseInt(familyId);
      if (isNaN(familyIdNum)) {
        return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
      }

      // 移除权限检查 - 所有人都可以访问
      messages = db.prepare(`
        SELECT m.*, u.name as user_name, u.avatar as user_avatar, f.name as family_name
        FROM messages m
        JOIN users u ON m.user_id = u.id
        JOIN families f ON m.family_id = f.id
        WHERE m.family_id = ?
        ORDER BY m.created_at DESC
      `).all(familyIdNum);
    } else {
      // 获取所有家族的留言（不再限制用户）
      messages = db.prepare(`
        SELECT m.*, u.name as user_name, u.avatar as user_avatar, f.name as family_name
        FROM messages m
        JOIN users u ON m.user_id = u.id
        JOIN families f ON m.family_id = f.id
        ORDER BY m.created_at DESC
      `).all();
    }

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('获取留言接口错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
