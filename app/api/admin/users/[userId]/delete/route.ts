import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 完全移除管理员检查 - 允许所有人删除用户
    const { userId } = await params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return NextResponse.json({ success: false, error: '无效的用户ID' }, { status: 400 });
    }

    // 不能删除超级管理员
    const userToDelete = db.prepare('SELECT email FROM users WHERE id = ?').get(userIdNum) as { email: string };
    if (!userToDelete) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    if (userToDelete.email === 'admin@family.com') {
      return NextResponse.json({ success: false, error: '不能删除超级管理员账号' }, { status: 400 });
    }

    // 开始删除 - 需要先删除所有关联数据
    // 逐个删除，忽略表不存在的错误
    const tablesToClean = [
      'DELETE FROM chat_messages WHERE user_id = ?',
      'DELETE FROM chat_message_reads WHERE user_id = ?',
      'DELETE FROM messages WHERE user_id = ?',
      'DELETE FROM announcements WHERE user_id = ?',
      'DELETE FROM family_members WHERE user_id = ?',
      'DELETE FROM user_login_logs WHERE user_id = ?',
      'DELETE FROM plugin_growth_book_history WHERE user_id = ?',
      'DELETE FROM plugin_growth_book_favorites WHERE user_id = ?',
    ];

    for (const sql of tablesToClean) {
      try {
        db.prepare(sql).run(userIdNum);
      } catch (e) {
        // 表不存在没关系，跳过
        console.warn(`Failed to clean table ${sql}, skipping:`, e);
      }
    }
    
    // 如果用户创建了家族，这些家族保留但 creator_id 设为 NULL
    try {
      db.prepare('UPDATE families SET creator_id = NULL WHERE creator_id = ?').run(userIdNum);
    } catch (e) {
      console.warn('Failed to update families creator_id:', e);
    }
    
    // 最后删除用户本身
    db.prepare('DELETE FROM users WHERE id = ?').run(userIdNum);

    return NextResponse.json({ 
      success: true, 
      message: '用户删除成功' 
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
