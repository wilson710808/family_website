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
    console.log(`[DELETE USER] Attempting to delete user id=${userIdNum}`);

    if (isNaN(userIdNum)) {
      console.log(`[DELETE USER] Invalid user id: ${userId}`);
      return NextResponse.json({ success: false, error: '无效的用户ID' }, { status: 400 });
    }

    // 不能删除超级管理员
    const userToDelete = db.prepare('SELECT email FROM users WHERE id = ?').get(userIdNum) as { email: string };
    if (!userToDelete) {
      console.log(`[DELETE USER] User ${userIdNum} not found`);
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    if (userToDelete.email === 'admin@family.com') {
      console.log(`[DELETE USER] Cannot delete super admin: ${userToDelete.email}`);
      return NextResponse.json({ success: false, error: '不能删除超级管理员账号' }, { status: 400 });
    }

    console.log(`[DELETE USER] Deleting user: ${userToDelete.email} (id=${userIdNum})`);

    // 我们需要在事务外重新创建db连接，因为导入的db是共享连接
    const dbPath = process.env.DB_PATH || './family.db';
    const Database = (await import('better-sqlite3')).default;
    const dbConn = new Database(dbPath);

    // 开始删除 - 需要先删除所有关联数据
    // 逐个删除，忽略表不存在的错误
    
    // 1. 删除聊天消息
    try {
      console.log('[DELETE USER] Cleaning chat_messages...');
      dbConn.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userIdNum);
    } catch (e) { 
      console.warn('[DELETE USER] Clean chat_messages failed (skip):', (e as Error).message); 
    }
    
    // 2. 删除聊天已读标记
    try {
      console.log('[DELETE USER] Cleaning chat_message_reads...');
      dbConn.prepare('DELETE FROM chat_message_reads WHERE user_id = ?').run(userIdNum);
    } catch (e) { 
      console.warn('[DELETE USER] Clean chat_message_reads failed (skip):', (e as Error).message); 
    }
    
    // 3. 删除留言
    try {
      console.log('[DELETE USER] Cleaning messages...');
      dbConn.prepare('DELETE FROM messages WHERE user_id = ?').run(userIdNum);
    } catch (e) { 
      console.warn('[DELETE USER] Clean messages failed (skip):', (e as Error).message); 
    }
    
    // 4. 删除公告
    try {
      console.log('[DELETE USER] Cleaning announcements...');
      dbConn.prepare('DELETE FROM announcements WHERE user_id = ?').run(userIdNum);
    } catch (e) { 
      console.warn('[DELETE USER] Clean announcements failed (skip):', (e as Error).message); 
    }
    
    // 5. 删除家族成员关系
    try {
      console.log('[DELETE USER] Cleaning family_members...');
      dbConn.prepare('DELETE FROM family_members WHERE user_id = ?').run(userIdNum);
    } catch (e) { 
      console.warn('[DELETE USER] Clean family_members failed (skip):', (e as Error).message); 
    }
    
    // 6. 删除登录日志
    try {
      console.log('[DELETE USER] Cleaning user_login_logs...');
      dbConn.prepare('DELETE FROM user_login_logs WHERE user_id = ?').run(userIdNum);
    } catch (e) { 
      console.warn('[DELETE USER] Clean user_login_logs failed (skip):', (e as Error).message); 
    }
    
    // 7. 删除成长专栏历史 - 表可能不存在
    try {
      console.log('[DELETE USER] Cleaning plugin_growth_book_history...');
      dbConn.prepare('DELETE FROM plugin_growth_book_history WHERE user_id = ?').run(userIdNum);
    } catch (e) { 
      console.warn('[DELETE USER] Clean plugin_growth_book_history failed (skip):', (e as Error).message); 
    }
    
    // 8. 删除成长专栏收藏 - 表可能不存在
    try {
      console.log('[DELETE USER] Cleaning plugin_growth_book_favorites...');
      dbConn.prepare('DELETE FROM plugin_growth_book_favorites WHERE user_id = ?').run(userIdNum);
    } catch (e) { 
      console.warn('[DELETE USER] Clean plugin_growth_book_favorites failed (skip):', (e as Error).message); 
    }
    
    // 9. 清理家族相册插件数据 - 用户上传的照片
    try {
      console.log('[DELETE USER] Cleaning family album photos...');
      // 删除用户上传的照片的评论和点赞，然后删除照片
      // 先获取用户上传的所有照片
      const userPhotos: { id: number, album_id: number }[] = dbConn.prepare('SELECT id, album_id FROM plugin_album_photos WHERE uploaded_by = ?').all(userIdNum) as { id: number, album_id: number }[];
      for (const photo of userPhotos) {
        dbConn.prepare('DELETE FROM plugin_album_likes WHERE photo_id = ?').run(photo.id);
        dbConn.prepare('DELETE FROM plugin_album_comments WHERE photo_id = ?').run(photo.id);
        dbConn.prepare('DELETE FROM plugin_album_photos WHERE id = ?').run(photo.id);
      }
      // 如果用户创建了相册，删除用户创建的相册及其所有内容
      const userAlbums: { id: number }[] = dbConn.prepare('SELECT id FROM plugin_album_albums WHERE created_by = ?').all(userIdNum) as { id: number }[];
      for (const album of userAlbums) {
        // 删除相册中所有照片及其评论点赞
        const albumPhotos: { id: number }[] = dbConn.prepare('SELECT id FROM plugin_album_photos WHERE album_id = ?').all(album.id) as { id: number }[];
        for (const photo of albumPhotos) {
          dbConn.prepare('DELETE FROM plugin_album_likes WHERE photo_id = ?').run(photo.id);
          dbConn.prepare('DELETE FROM plugin_album_comments WHERE photo_id = ?').run(photo.id);
          dbConn.prepare('DELETE FROM plugin_album_photos WHERE id = ?').run(photo.id);
        }
        dbConn.prepare('DELETE FROM plugin_album_albums WHERE id = ?').run(album.id);
      }
      console.log('[DELETE USER] Family album data cleaned');
    } catch (e) { 
      console.warn('[DELETE USER] Clean family album data failed (skip):', (e as Error).message); 
    }
    
    // 10. 如果用户创建了家族，这些家族保留但 creator_id 设为 NULL
    try {
      console.log('[DELETE USER] Updating families creator_id...');
      dbConn.prepare('UPDATE families SET creator_id = NULL WHERE creator_id = ?').run(userIdNum);
    } catch (e) { 
      console.warn('[DELETE USER] Update families creator_id failed (skip):', (e as Error).message); 
    }
    
    // 11. 最后删除用户本身 - users 表一定存在
    try {
      console.log('[DELETE USER] Final delete from users...');
      dbConn.prepare('DELETE FROM users WHERE id = ?').run(userIdNum);
    } catch (finalError) {
      console.error('[DELETE USER] Final delete user failed:', finalError);
      dbConn.close();
      throw finalError;
    }

    dbConn.close();
    console.log(`[DELETE USER] User ${userIdNum} deleted successfully`);

    return NextResponse.json({ 
      success: true, 
      message: '用户删除成功' 
    });
  } catch (error) {
    console.error('[DELETE USER] Overall error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: `删除失败: ${errorMessage}` }, { status: 500 });
  }
}
