import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    if (user.is_admin !== 1) {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 });
    }

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').pluck().get() as number;
    const familyCount = db.prepare('SELECT COUNT(*) as count FROM families').pluck().get() as number;
    const announcementCount = db.prepare('SELECT COUNT(*) as count FROM announcements').pluck().get() as number;
    const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages').pluck().get() as number;

    return NextResponse.json({
      success: true,
      stats: { userCount, familyCount, announcementCount, messageCount },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}
