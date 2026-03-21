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
    // 1. 删除用户的聊天消息
    db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userIdNum);
    
    // 2. 删除用户的留言
    db.prepare('DELETE FROM messages WHERE user_id = ?').run(userIdNum);
    
    // 3. 删除用户的公告
    db.prepare('DELETE FROM announcements WHERE user_id = ?').run(userIdNum);
    
    // 4. 删除用户的家族成员关系
    db.prepare('DELETE FROM family_members WHERE user_id = ?').run(userIdNum);
    
    // 5. 如果用户创建了家族，这些家族保留但 creator_id 设为 NULL（或者可以选择删除，这里选择保留）
    db.prepare('UPDATE families SET creator_id = NULL WHERE creator_id = ?').run(userIdNum);
    
    // 6. 最后删除用户本身
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
