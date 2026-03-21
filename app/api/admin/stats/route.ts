import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 完全移除管理员检查 - 允许所有人访问统计数据
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').pluck().get() as number;
    const familyCount = db.prepare('SELECT COUNT(*) as count FROM families').pluck().get() as number;
    const announcementCount = db.prepare('SELECT COUNT(*) as count FROM announcements').pluck().get() as number;
    const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages').pluck().get() as number;
    const chatMessageCount = db.prepare('SELECT COUNT(*) as count FROM chat_messages').pluck().get() as number;

    return NextResponse.json({
      success: true,
      stats: {
        userCount,
        familyCount,
        announcementCount,
        messageCount,
        chatMessageCount,
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ success: false, error: '获取失败' }, { status: 500 });
  }
}
