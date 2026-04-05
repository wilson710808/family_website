import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { addContributionPoints } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const familyId = searchParams.get('familyId');
  const userId = searchParams.get('userId');

  if (!familyId) {
    return NextResponse.json({ success: false, error: '需要家族ID' }, { status: 400 });
  }

  try {
    // 获取家族聊天历史，按时间升序排列（最新在底部）
    // 使用 LEFT JOIN 支持管家消息（user_id = 0）
    const messages = db.prepare(`
      SELECT 
        cm.id, 
        cm.family_id, 
        cm.user_id, 
        cm.content, 
        cm.created_at,
        COALESCE(u.name, '聊天室管家') as user_name,
        COALESCE(u.avatar, 'https://api.dicebear.com/7.x/bottts/svg?seed=butler') as user_avatar,
        (SELECT COUNT(*) FROM chat_message_reads cmr WHERE cmr.message_id = cm.id) as read_count
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.family_id = ?
      ORDER BY cm.created_at ASC
      LIMIT 500
    `).all(Number(familyId)) as any[];

    // 获取总成员数（已批准的）
    const totalMembers = db.prepare(`
      SELECT COUNT(*) as count FROM family_members
      WHERE family_id = ? AND status = 'approved'
    `).pluck().get(Number(familyId)) as number;

    return NextResponse.json({
      success: true,
      messages,
      totalMembers,
      currentUserId: userId ? Number(userId) : null,
    });
  } catch (error) {
    console.error('获取聊天记录失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}

// 标记消息已读
export async function POST(request: NextRequest) {
  try {
    const { messageId, familyId, userId } = await request.json();
    if (!messageId || !familyId || !userId) {
      return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 });
    }

    // 插入已读记录（使用 INSERT OR IGNORE 防止重复）
    db.prepare(`
      INSERT OR IGNORE INTO chat_message_reads (message_id, family_id, user_id)
      VALUES (?, ?, ?)
    `).run(messageId, familyId, userId);

    // 获取更新后的已读计数
    const readCount = db.prepare(`
      SELECT COUNT(*) as count FROM chat_message_reads
      WHERE message_id = ?
    `).pluck().get(messageId) as number;

    // 发送消息者获得贡献积分
    const message = db.prepare(`
      SELECT user_id FROM chat_messages WHERE id = ?
    `).get(messageId) as { user_id: number };

    if (message && message.user_id !== userId && message.user_id !== 0) {
      // 他人阅读了你的消息，你获得 +2 积分（管家不获得积分）
      addContributionPoints(Number(familyId), message.user_id, 2);
    }

    return NextResponse.json({ success: true, readCount });
  } catch (error) {
    console.error('标记已读失败:', error);
    return NextResponse.json({ success: false, error: '标记失败' }, { status: 500 });
  }
}
