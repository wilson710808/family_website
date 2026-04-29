import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// 标记通知为已读
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { notificationId, markAllRead, familyId } = await request.json();

    if (markAllRead && familyId) {
      // 标记该家族所有通知为已读
      db.prepare(`
        UPDATE plugin_notifications SET is_read = 1
        WHERE user_id = ? AND family_id = ? AND is_read = 0
      `).run(user.id, Number(familyId));
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: '缺少通知ID' }, { status: 400 });
    }

    // 只能标记自己的通知
    db.prepare(`
      UPDATE plugin_notifications SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).run(Number(notificationId), user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('标记通知失败:', error);
    return NextResponse.json({ success: false, error: '操作失败' }, { status: 500 });
  }
}

// 删除通知
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ success: false, error: '缺少通知ID' }, { status: 400 });
    }

    // 只能删除自己的通知
    db.prepare(`
      DELETE FROM plugin_notifications WHERE id = ? AND user_id = ?
    `).run(Number(notificationId), user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除通知失败:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
