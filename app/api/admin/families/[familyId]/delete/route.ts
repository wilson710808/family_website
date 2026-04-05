import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 导入家族相册插件（如果启用）
let familyAlbum: any;
try {
  familyAlbum = require('@/plugins/family-album');
} catch (e) {
  familyAlbum = null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const { familyId } = await params;
    const familyIdNum = parseInt(familyId);
    console.log(`[DELETE FAMILY] Attempting to delete family id=${familyIdNum}`);

    if (isNaN(familyIdNum)) {
      console.log(`[DELETE FAMILY] Invalid family id: ${familyId}`);
      return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
    }

    // 检查家族是否存在
    const familyToDelete = db.prepare('SELECT id, name FROM families WHERE id = ?').get(familyIdNum) as { id: number, name: string };
    if (!familyToDelete) {
      console.log(`[DELETE FAMILY] Family ${familyIdNum} not found`);
      return NextResponse.json({ success: false, error: '家族不存在' }, { status: 404 });
    }

    console.log(`[DELETE FAMILY] Deleting family: ${familyToDelete.name} (id=${familyIdNum})`);

    // 我们需要在事务外重新创建db连接，因为导入的db是共享连接
    const dbPath = process.env.DB_PATH || './family.db';
    const Database = (await import('better-sqlite3')).default;
    const dbConn = new Database(dbPath);

    // 开始删除 - 需要先删除所有关联数据
    // 逐个删除，忽略表不存在的错误
    
    // 1. 删除家族成员关系
    try {
      console.log('[DELETE FAMILY] Cleaning family_members...');
      dbConn.prepare('DELETE FROM family_members WHERE family_id = ?').run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Clean family_members failed (skip):', (e as Error).message); 
    }
    
    // 2. 删除聊天消息
    try {
      console.log('[DELETE FAMILY] Cleaning chat_messages...');
      dbConn.prepare('DELETE FROM chat_messages WHERE family_id = ?').run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Clean chat_messages failed (skip):', (e as Error).message); 
    }
    
    // 3. 删除聊天已读标记
    try {
      console.log('[DELETE FAMILY] Cleaning chat_message_reads...');
      dbConn.prepare('DELETE FROM chat_message_reads WHERE family_id = ?').run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Clean chat_message_reads failed (skip):', (e as Error).message); 
    }
    
    // 4. 删除留言
    try {
      console.log('[DELETE FAMILY] Cleaning messages...');
      dbConn.prepare('DELETE FROM messages WHERE family_id = ?').run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Clean messages failed (skip):', (e as Error).message); 
    }
    
    // 5. 删除公告
    try {
      console.log('[DELETE FAMILY] Cleaning announcements...');
      dbConn.prepare('DELETE FROM announcements WHERE family_id = ?').run(familyIdNum);
    } catch (e) { 
      console.warn('[DELETE FAMILY] Clean announcements failed (skip):', (e as Error).message); 
    }
    
    // 6. 清理家族相册插件数据（如果插件启用）
    try {
      if (familyAlbum && familyAlbum.isEnabled && familyAlbum.isEnabled()) {
        console.log('[DELETE FAMILY] Cleaning family album plugin data...');
        // 需要删除该家族下所有相册及其照片
        // 先获取所有相册
        const albums: { id: number }[] = dbConn.prepare('SELECT id FROM plugin_album_albums WHERE family_id = ?').all(familyIdNum) as { id: number }[];
        for (const album of albums) {
          // 删除相册中所有照片
          dbConn.prepare('DELETE FROM plugin_album_photos WHERE album_id = ?').run(album.id);
          // 删除照片点赞和评论
          const photos: { id: number }[] = dbConn.prepare('SELECT id FROM plugin_album_photos WHERE album_id = ?').all(album.id) as { id: number }[];
          for (const photo of photos) {
            dbConn.prepare('DELETE FROM plugin_album_likes WHERE photo_id = ?').run(photo.id);
            dbConn.prepare('DELETE FROM plugin_album_comments WHERE photo_id = ?').run(photo.id);
          }
          // 删除相册本身
          dbConn.prepare('DELETE FROM plugin_album_albums WHERE id = ?').run(album.id);
        }
        console.log('[DELETE FAMILY] Family album data cleaned');
      } else {
        console.log('[DELETE FAMILY] Family album plugin disabled or not loaded, skip');
      }
    } catch (e) { 
      console.warn('[DELETE FAMILY] Clean family album data failed (skip):', (e as Error).message); 
    }
    
    // 7. 清理成长专栏插件数据（如果有家族相关数据）
    // 目前成长专栏是按用户的，所以不需要删除家族相关
    
    // 8. 最后删除家族本身
    try {
      console.log('[DELETE FAMILY] Final delete from families...');
      dbConn.prepare('DELETE FROM families WHERE id = ?').run(familyIdNum);
    } catch (finalError) {
      console.error('[DELETE FAMILY] Final delete family failed:', finalError);
      dbConn.close();
      throw finalError;
    }

    dbConn.close();
    console.log(`[DELETE FAMILY] Family ${familyIdNum} deleted successfully`);

    return NextResponse.json({ 
      success: true, 
      message: '家族删除成功' 
    });
  } catch (error) {
    console.error('[DELETE FAMILY] Overall error:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: `删除失败: ${errorMessage}` }, { status: 500 });
  }
}
