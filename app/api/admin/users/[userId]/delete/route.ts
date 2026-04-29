import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    if (user.is_admin !== 1) {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 });
    }

    const { userId } = await params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return NextResponse.json({ success: false, error: '无效的用户ID' }, { status: 400 });
    }

    // 不允许删除超级管理员自己
    if (userIdNum === user.id) {
      return NextResponse.json({ success: false, error: '不能删除自己' }, { status: 400 });
    }

    // 检查目标用户是否也是管理员
    const targetUser = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userIdNum) as { is_admin: number } | undefined;
    if (!targetUser) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }
    if (targetUser.is_admin === 1) {
      return NextResponse.json({ success: false, error: '不能删除其他管理员' }, { status: 403 });
    }

    // 使用事务删除
    const deleteTransaction = db.transaction(() => {
      db.prepare('DELETE FROM family_members WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM messages WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM user_login_logs WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM plugin_butler_chat_memory WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM plugin_butler_memories WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM plugin_butler_user_preferences WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM plugin_growth_book_history WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM plugin_growth_book_favorites WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM plugin_notification_settings WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM plugin_notifications WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM plugin_stats_member_activity WHERE user_id = ?').run(userIdNum);
      db.prepare('DELETE FROM users WHERE id = ?').run(userIdNum);
    });

    deleteTransaction();

    return NextResponse.json({ success: true, message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { success: false, error: `删除失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
