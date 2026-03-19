import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const familyId = searchParams.get('familyId');

  if (!familyId) {
    return NextResponse.json({ success: false, error: '需要家族ID' }, { status: 400 });
  }

  try {
    // 获取家族聊天历史，按时间升序排列（最新在底部）
    const messages = db.prepare(`
      SELECT cm.id, cm.family_id, cm.user_id, cm.content, cm.created_at,
             u.name as user_name, u.avatar as user_avatar
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.family_id = ?
      ORDER BY cm.created_at ASC
      LIMIT 500
    `).all(Number(familyId));

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('获取聊天记录失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}
