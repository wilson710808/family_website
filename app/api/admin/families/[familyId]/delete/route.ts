import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }
    if (user.is_admin !== 1) {
      return NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 });
    }

    const { familyId } = await params;
    const familyIdNum = parseInt(familyId);

    if (isNaN(familyIdNum)) {
      return NextResponse.json({ success: false, error: '无效的家族ID' }, { status: 400 });
    }

    // 使用事务删除家族所有数据
    const deleteTransaction = db.transaction(() => {
      // 删除插件相关数据
      const tablesToClean = [
        { table: 'family_members', column: 'family_id' },
        { table: 'announcements', column: 'family_id' },
        { table: 'messages', column: 'family_id' },
        { table: 'chat_messages', column: 'family_id' },
        { table: 'chat_message_reads', column: 'family_id' },
        { table: 'plugin_growth_book_history', column: 'family_id' },
        { table: 'plugin_growth_book_favorites', column: 'family_id' },
        { table: 'plugin_birthday_reminders', column: 'family_id' },
        { table: 'plugin_birthday_settings', column: 'family_id' },
        { table: 'plugin_calendar_events', column: 'family_id' },
        { table: 'plugin_calendar_participants', column: 'family_id' },
        { table: 'plugin_butler_scheduled_reminders', column: 'family_id' },
        { table: 'plugin_butler_announcements', column: 'family_id' },
        { table: 'plugin_butler_daily_summaries', column: 'family_id' },
        { table: 'plugin_butler_annual_summaries', column: 'family_id' },
        { table: 'plugin_butler_member_profiles', column: 'family_id' },
        { table: 'plugin_document_folders', column: 'family_id' },
        { table: 'plugin_document_files', column: 'family_id' },
        { table: 'plugin_document_permissions', column: 'family_id' },
        { table: 'plugin_stats_daily', column: 'family_id' },
        { table: 'plugin_stats_member_activity', column: 'family_id' },
        { table: 'plugin_tree_members', column: 'family_id' },
        { table: 'plugin_tree_connections', column: 'family_id' },
        { table: 'plugin_notifications', column: 'family_id' },
        { table: 'plugin_notification_settings', column: 'family_id' },
      ];

      for (const { table, column } of tablesToClean) {
        try {
          db.prepare(`DELETE FROM ${table} WHERE ${column} = ?`).run(familyIdNum);
        } catch (e) {
          // 表可能不存在，忽略
        }
      }

      // 删除相册相关数据（有依赖顺序）
      try {
        const photos = db.prepare('SELECT id FROM plugin_album_photos WHERE family_id = ?').all(familyIdNum) as { id: number }[];
        for (const photo of photos) {
          db.prepare('DELETE FROM plugin_album_likes WHERE photo_id = ?').run(photo.id);
          db.prepare('DELETE FROM plugin_album_comments WHERE photo_id = ?').run(photo.id);
        }
        db.prepare('DELETE FROM plugin_album_photos WHERE family_id = ?').run(familyIdNum);
        db.prepare('DELETE FROM plugin_album_albums WHERE family_id = ?').run(familyIdNum);
      } catch (e) { /* ignore */ }

      // 删除家族本身
      db.prepare('DELETE FROM families WHERE id = ?').run(familyIdNum);
    });

    deleteTransaction();

    return NextResponse.json({ success: true, message: '家族删除成功' });
  } catch (error) {
    console.error('删除家族失败:', error);
    return NextResponse.json(
      { success: false, error: `删除失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
