import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser, isUserInFamily, addContributionPoints } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const familyId = searchParams.get('familyId');
    const before = searchParams.get('before'); // 游標：加載此 ID 之前的消息
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    if (!familyId) {
      return NextResponse.json({ success: false, error: '需要家族ID' }, { status: 400 });
    }

    const familyIdNum = Number(familyId);
    const inFamily = await isUserInFamily(user.id, familyIdNum);
    if (!inFamily) {
      return NextResponse.json({ success: false, error: '你不是該家族成員' }, { status: 403 });
    }

    // 分頁查詢：支持游標分頁
    let messages: any[];
    if (before) {
      messages = db.prepare(`
        SELECT cm.id, cm.family_id, cm.user_id, cm.content, cm.created_at, cm.message_type,
          COALESCE(u.name, '聊天室管家') as user_name,
          COALESCE(u.avatar, 'https://api.dicebear.com/7.x/bottts/svg?seed=butler') as user_avatar,
          (SELECT COUNT(*) FROM chat_message_reads cmr WHERE cmr.message_id = cm.id) as read_count
        FROM chat_messages cm
        LEFT JOIN users u ON cm.user_id = u.id
        WHERE cm.family_id = ? AND cm.id < ?
        ORDER BY cm.created_at DESC
        LIMIT ?
      `).all(familyIdNum, Number(before), limit) as any[];
      messages.reverse();
    } else {
      messages = db.prepare(`
        SELECT cm.id, cm.family_id, cm.user_id, cm.content, cm.created_at, cm.message_type,
          COALESCE(u.name, '聊天室管家') as user_name,
          COALESCE(u.avatar, 'https://api.dicebear.com/7.x/bottts/svg?seed=butler') as user_avatar,
          (SELECT COUNT(*) FROM chat_message_reads cmr WHERE cmr.message_id = cm.id) as read_count
        FROM chat_messages cm
        LEFT JOIN users u ON cm.user_id = u.id
        WHERE cm.family_id = ?
        ORDER BY cm.created_at ASC
        LIMIT ?
      `).all(familyIdNum, limit) as any[];
    }

    // 获取总成员数
    const totalMembers = db.prepare(`
      SELECT COUNT(*) as count FROM family_members
      WHERE family_id = ? AND status = 'approved'
    `).pluck().get(familyIdNum) as number;

    // 获取最新消息 ID（用于前端判断是否还有更多）
    const latestId = db.prepare(`
      SELECT MAX(id) as id FROM chat_messages WHERE family_id = ?
    `).pluck().get(familyIdNum) as number | null;

    const oldestId = messages.length > 0 ? messages[0].id : null;
    const hasMore = oldestId !== null && latestId !== null && oldestId > (db.prepare('SELECT MIN(id) as id FROM chat_messages WHERE family_id = ?').pluck().get(familyIdNum) as number);

    return NextResponse.json({
      success: true,
      messages,
      totalMembers,
      currentUserId: user.id,
      pagination: {
        oldestId,
        hasMore: messages.length >= limit,
        limit,
      },
    });
  } catch (error) {
    console.error('獲取聊天記錄失敗:', error);
    return NextResponse.json({ success: false, error: '獲取失敗' }, { status: 500 });
  }
}

// 标记消息已读
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }

    const { messageId, familyId, userId } = await request.json();
    if (!messageId || !familyId) {
      return NextResponse.json({ success: false, error: '缺少參數' }, { status: 400 });
    }

    db.prepare(`
      INSERT OR IGNORE INTO chat_message_reads (message_id, family_id, user_id)
      VALUES (?, ?, ?)
    `).run(messageId, familyId, user.id);

    const readCount = db.prepare(`
      SELECT COUNT(*) as count FROM chat_message_reads WHERE message_id = ?
    `).pluck().get(messageId) as number;

    const message = db.prepare(`SELECT user_id FROM chat_messages WHERE id = ?`).get(messageId) as { user_id: number };
    if (message && message.user_id !== user.id && message.user_id !== 0) {
      addContributionPoints(Number(familyId), message.user_id, 2);
    }

    return NextResponse.json({ success: true, readCount });
  } catch (error) {
    console.error('標記已讀失敗:', error);
    return NextResponse.json({ success: false, error: '標記失敗' }, { status: 500 });
  }
}
