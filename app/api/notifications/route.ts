import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 获取用户通知列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: '缺少 userId' }, { status: 400 });
    }

    let notifications;
    if (unreadOnly) {
      notifications = db.prepare(`
        SELECT * FROM plugin_notifications
        WHERE user_id = ? AND is_read = 0
        ORDER BY created_at DESC
        LIMIT ?
      `).all(Number(userId), limit);
    } else {
      notifications = db.prepare(`
        SELECT * FROM plugin_notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(Number(userId), limit);
    }

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_notifications
      WHERE user_id = ? AND is_read = 0
    `).get(Number(userId)) as { count: number };

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: unreadCount.count,
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    return NextResponse.json({ error: '获取通知失败' }, { status: 500 });
  }
}

// 创建通知
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { family_id, user_id, type, title, content, link } = body;

    if (!family_id || !user_id || !type || !title) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO plugin_notifications (family_id, user_id, type, title, content, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(family_id, user_id, type, title, content || null, link || null);

    return NextResponse.json({
      success: true,
      notificationId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error('创建通知失败:', error);
    return NextResponse.json({ error: '创建通知失败' }, { status: 500 });
  }
}
