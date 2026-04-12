import { NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }
    const { familyId } = await params;
    const familyIdNum = parseInt(familyId);
    console.log(`[DELETE FAMILY] Attempting to delete family id=${familyIdNum} by user=${user.id}`);

    if (isNaN(familyIdNum)) {
      console.log(`[DELETE FAMILY] Invalid family id: ${familyId}`);
      return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
    }

    // 动态导入 better-sqlite3，每次新建连接
    const Database = (await import('better-sqlite3')).default;
    const dbPath = process.env.DB_PATH || './family.db';
    const db = new Database(dbPath);

    // 检查权限：
    // 1. 超级管理员（系统管理员，is_admin = 1）可以删除任何家族
    // 2. 家族管理员只能删除自己家族
    const isSuperAdmin = user.is_admin === 1;
    
    if (!isSuperAdmin) {
      const memberInfo = db.prepare(`
        SELECT role FROM family_members 
        WHERE family_id = ? AND user_id = ? AND status = 'approved'
      `).get(familyIdNum, user.id) as { role: string } | undefined;

      if (!memberInfo) {
        console.log(`[DELETE FAMILY] User ${user.id} not a member of family ${familyIdNum}`);
        db.close();
        return NextResponse.json({ success: false, error: '你不是该家族成员' }, { status: 403 });
      }

      // 只有管理员可以删除家族
      if (memberInfo.role !== 'admin') {
        console.log(`[DELETE FAMILY] User ${user.id} not admin`);
        db.close();
        return NextResponse.json({ success: false, error: '只有管理员可以删除家族' }, { status: 403 });
      }
    }

    // 超级管理员或家族管理员可以删除
    console.log(`[DELETE FAMILY] Permission check passed for user ${user.id}`);

    // 开始删除家族相关数据
    // SQLite 不支持外键级联删除，需要手动删除所有相关数据

    // 1. 删除所有成员关系
    try {
      console.log('[DELETE FAMILY] Deleting family_members...');
      db.prepare(`DELETE FROM family_members WHERE family_id = ?`).run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Delete family_members failed:', (e as Error).message); 
    }

    // 2. 删除所有公告
    try {
      console.log('[DELETE FAMILY] Deleting announcements...');
      db.prepare(`DELETE FROM announcements WHERE family_id = ?`).run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Delete announcements failed:', (e as Error).message); 
    }

    // 3. 删除所有消息
    try {
      console.log('[DELETE FAMILY] Deleting messages...');
      db.prepare(`DELETE FROM messages WHERE family_id = ?`).run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Delete messages failed:', (e as Error).message); 
    }

    // 4. 删除聊天消息
    try {
      console.log('[DELETE FAMILY] Deleting chat_messages...');
      db.prepare(`DELETE FROM chat_messages WHERE family_id = ?`).run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Delete chat_messages failed:', (e as Error).message); 
    }

    // 5. 删除成长专栏历史和收藏（如果插件表存在）
    try {
      console.log('[DELETE FAMILY] Deleting growth column data...');
      db.prepare(`DELETE FROM plugin_growth_book_history WHERE family_id = ?`).run(familyIdNum);
      db.prepare(`DELETE FROM plugin_growth_book_favorites WHERE family_id = ?`).run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Delete growth column failed:', (e as Error).message); 
    }

    // 6. 删除生日提醒设置（如果插件表存在）
    try {
      console.log('[DELETE FAMILY] Deleting birthday reminders...');
      db.prepare(`DELETE FROM birthday_reminders WHERE family_id = ?`).run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Delete birthday reminders failed:', (e as Error).message); 
    }

    // 7. 删除家庭相册数据（如果插件表存在）- 使用新的插件表名前缀
    try {
      console.log('[DELETE FAMILY] Deleting album data...');
      // 删除照片点赞和评论
      const photos: { id: number }[] = db.prepare(`SELECT id FROM plugin_album_photos WHERE family_id = ?`).all(familyIdNum) as { id: number }[];
      for (const photo of photos) {
        db.prepare(`DELETE FROM plugin_album_likes WHERE photo_id = ?`).run(photo.id);
        db.prepare(`DELETE FROM plugin_album_comments WHERE photo_id = ?`).run(photo.id);
      }
      db.prepare(`DELETE FROM plugin_album_photos WHERE family_id = ?`).run(familyIdNum);
      // 删除相册
      db.prepare(`DELETE FROM plugin_album_albums WHERE family_id = ?`).run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Delete album failed:', (e as Error).message); 
    }

    // 8. 最后删除家族本身
    try {
      console.log('[DELETE FAMILY] Final delete from families...');
      db.prepare(`DELETE FROM families WHERE id = ?`).run(familyIdNum);
    } catch (finalError) {
      console.error('[DELETE FAMILY] Final delete failed:', finalError);
      db.close();
      throw finalError;
    }

    console.log(`[DELETE FAMILY] Family ${familyIdNum} deleted successfully by user ${user.id}`);
    db.close();

    // 对于 AJAX 请求返回 JSON，不重定向
    return NextResponse.json({ 
      success: true, 
      message: '家族删除成功' 
    });
  } catch (error) {
    console.error('[DELETE FAMILY] Overall error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { success: false, error: `删除失败: ${errorMessage}` },
      { status: 500 }
    );
  }
}
