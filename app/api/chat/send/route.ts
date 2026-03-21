import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, addContributionPoints } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 完全移除认证检查 - 允许所有人发言
    const user = await getCurrentUser();
    const { familyId, content } = await request.json();

    if (!familyId || !content?.trim()) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 });
    }

    // 插入消息（移除权限检查）
    const result = db.prepare(`
      INSERT INTO chat_messages (family_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(Number(familyId), user.id, content.trim());

    // 添加贡献积分：发送聊天消息 +2 积分
    addContributionPoints(Number(familyId), user.id, 2);

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
