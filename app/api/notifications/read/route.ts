import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 标记通知为已读
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId, markAll } = body;

    if (markAll && userId) {
      // 标记所有为已读
      const result = db.prepare(`
        UPDATE plugin_notifications
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND is_read = 0
      `).run(userId);

      return NextResponse.json({
        success: true,
        updatedCount: result.changes,
      });
    }

    if (!notificationId || !userId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 标记单个为已读
    const result = db.prepare(`
      UPDATE plugin_notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(notificationId, userId);

    if (result.changes === 0) {
      return NextResponse.json({ error: '通知不存在或无权限' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('标记已读失败:', error);
    return NextResponse.json({ error: '标记已读失败' }, { status: 500 });
  }
}

// 删除通知
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');
    const userId = searchParams.get('userId');

    if (!notificationId || !userId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const result = db.prepare(`
      DELETE FROM plugin_notifications WHERE id = ? AND user_id = ?
    `).run(Number(notificationId), Number(userId));

    if (result.changes === 0) {
      return NextResponse.json({ error: '通知不存在或无权限' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除通知失败:', error);
    return NextResponse.json({ error: '删除通知失败' }, { status: 500 });
  }
}
