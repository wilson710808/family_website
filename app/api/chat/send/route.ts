import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { familyId, content } = await request.json();

    if (!familyId || !content?.trim()) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    // 检查用户是否是该家族成员
    const membership = db.prepare(`
      SELECT status FROM family_members 
      WHERE family_id = ? AND user_id = ? AND status = 'approved'
    `).get(Number(familyId), user.id);

    if (!membership) {
      return NextResponse.json({ success: false, error: '你不是该家族成员，无法发言' }, { status: 403 });
    }

    // 插入消息
    const result = db.prepare(`
      INSERT INTO chat_messages (family_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(Number(familyId), user.id, content.trim());

    // 获取插入的消息
    const message = db.prepare(`
      SELECT cm.id, cm.family_id, cm.user_id, cm.content, cm.created_at,
             u.name as user_name, u.avatar as user_avatar
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.id = ?
    `).get(result.lastInsertRowid as number);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json({ success: false, error: '发送失败' }, { status: 500 });
  }
}
