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
    const dbConn = db;
    
    // 1. 删除聊天消息
    try {
      dbConn.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userIdNum);
    } catch (e) { console.warn('Clean chat_messages failed (skip):', e); }
    
    // 2. 删除聊天已读标记
    try {
      dbConn.prepare('DELETE FROM chat_message_reads WHERE user_id = ?').run(userIdNum);
    } catch (e) { console.warn('Clean chat_message_reads failed (skip):', e); }
    
    // 3. 删除留言
    try {
      dbConn.prepare('DELETE FROM messages WHERE user_id = ?').run(userIdNum);
    } catch (e) { console.warn('Clean messages failed (skip):', e); }
    
    // 4. 删除公告
    try {
      dbConn.prepare('DELETE FROM announcements WHERE user_id = ?').run(userIdNum);
    } catch (e) { console.warn('Clean announcements failed (skip):', e); }
    
    // 5. 删除家族成员关系
    try {
      dbConn.prepare('DELETE FROM family_members WHERE user_id = ?').run(userIdNum);
    } catch (e) { console.warn('Clean family_members failed (skip):', e); }
    
    // 6. 删除登录日志
    try {
      dbConn.prepare('DELETE FROM user_login_logs WHERE user_id = ?').run(userIdNum);
    } catch (e) { console.warn('Clean user_login_logs failed (skip):', e); }
    
    // 7. 删除成长专栏历史 - 表可能不存在
    try {
      dbConn.prepare('DELETE FROM plugin_growth_book_history WHERE user_id = ?').run(userIdNum);
    } catch (e) { console.warn('Clean plugin_growth_book_history failed (skip):', e); }
    
    // 8. 删除成长专栏收藏 - 表可能不存在
    try {
      dbConn.prepare('DELETE FROM plugin_growth_book_favorites WHERE user_id = ?').run(userIdNum);
    } catch (e) { console.warn('Clean plugin_growth_book_favorites failed (skip):', e); }
    
    // 9. 如果用户创建了家族，这些家族保留但 creator_id 设为 NULL
    try {
      dbConn.prepare('UPDATE families SET creator_id = NULL WHERE creator_id = ?').run(userIdNum);
    } catch (e) { console.warn('Update families creator_id failed (skip):', e); }
    
    // 10. 最后删除用户本身 - users 表一定存在
    try {
      dbConn.prepare('DELETE FROM users WHERE id = ?').run(userIdNum);
    } catch (finalError) {
      console.error('Final delete user failed:', finalError);
      throw finalError;
    }

    return NextResponse.json({ 
      success: true, 
      message: '用户删除成功' 
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
