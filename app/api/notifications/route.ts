import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

// 获取通知列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let notifications: any[];

    if (familyId) {
      const familyIdNum = parseInt(familyId);
      if (isNaN(familyIdNum)) {
        return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
      }

      if (unreadOnly) {
        notifications = db.prepare(`
          SELECT * FROM plugin_notifications
          WHERE family_id = ? AND user_id = ? AND is_read = 0
          ORDER BY created_at DESC LIMIT ?
        `).all(familyIdNum, user.id, limit) as any[];
      } else {
        notifications = db.prepare(`
          SELECT * FROM plugin_notifications
          WHERE family_id = ? AND user_id = ?
          ORDER BY created_at DESC LIMIT ?
        `).all(familyIdNum, user.id, limit) as any[];
      }
    } else {
      // 获取用户所有家族的通知
      if (unreadOnly) {
        notifications = db.prepare(`
          SELECT * FROM plugin_notifications
          WHERE user_id = ? AND is_read = 0
          ORDER BY created_at DESC LIMIT ?
        `).all(user.id, limit) as any[];
      } else {
        notifications = db.prepare(`
          SELECT * FROM plugin_notifications
          WHERE user_id = ?
          ORDER BY created_at DESC LIMIT ?
        `).all(user.id, limit) as any[];
      }
    }

    // 获取未读数
    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_notifications
      WHERE user_id = ? AND is_read = 0
    `).pluck().get(user.id) as number;

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('获取通知失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}

// 创建通知
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { familyId, userId: targetUserId, type, title, content, relatedId } = body;

    if (!familyId || !type || !title) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    // 只能给自己家族创建通知，或者管理员可以创建
    const recipientId = targetUserId || user.id;

    const result = db.prepare(`
      INSERT INTO plugin_notifications (family_id, user_id, type, title, content, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(familyId, recipientId, type, title, content || null, relatedId || null);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('创建通知失败:', error);
    return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
  }
}
