import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../plugins/message-board';
import { db } from '@/lib/db';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';

// 获取留言列表
export async function GET(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '插件已禁用' }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json({ error: '缺少家族ID' }, { status: 400 });
    }

    const familyIdNum = parseInt(familyId);
    if (isNaN(familyIdNum)) {
      return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
    }

    // 检查用户是否在家族中（可选，允许家族成员查看）
    if (user && !isUserInFamily(familyIdNum, user.id)) {
      // 仍然允许查看，不阻止
    }

    const messages = db.prepare(`
      SELECT m.*, u.name as user_name, u.avatar as user_avatar
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.family_id = ?
      ORDER BY m.created_at DESC
    `).all(familyIdNum);

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('获取留言失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
