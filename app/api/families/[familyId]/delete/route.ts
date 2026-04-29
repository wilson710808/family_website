import { NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登錄' }, { status: 401 });
    }

    const { familyId } = await params;
    const familyIdNum = parseInt(familyId);

    if (isNaN(familyIdNum)) {
      return NextResponse.json({ success: false, error: '無效的家族ID' }, { status: 400 });
    }

    // 权限检查：超级管理员或家族管理员
    const isSuperAdmin = user.is_admin === 1;
    if (!isSuperAdmin) {
      const memberInfo = db.prepare(`
        SELECT role FROM family_members
        WHERE family_id = ? AND user_id = ? AND status = 'approved'
      `).get(familyIdNum, user.id) as { role: string } | undefined;

      if (!memberInfo) {
        return NextResponse.json({ success: false, error: '你不是該家族成員' }, { status: 403 });
      }
      if (memberInfo.role !== 'admin') {
        return NextResponse.json({ success: false, error: '只有管理員可以刪除家族' }, { status: 403 });
      }
    }

    // 使用事务删除（使用全局 db 连接，而非新建连接）
    const deleteTransaction = db.transaction(() => {
      const tablesToClean = [
        'family_members',
        'announcements',
        'messages',
        'chat_messages',
        'chat_message_reads',
        'plugin_growth_book_history',
        'plugin_growth_book_favorites',
        'plugin_birthday_reminders',
        'plugin_birthday_settings',
        'plugin_calendar_events',
        'plugin_calendar_participants',
        'plugin_butler_scheduled_reminders',
        'plugin_butler_announcements',
        'plugin_butler_daily_summaries',
        'plugin_butler_annual_summaries',
        'plugin_butler_member_profiles',
        'plugin_document_folders',
        'plugin_document_files',
        'plugin_document_permissions',
        'plugin_stats_daily',
        'plugin_stats_member_activity',
        'plugin_tree_members',
        'plugin_tree_connections',
        'plugin_notifications',
        'plugin_notification_settings',
      ];

      for (const table of tablesToClean) {
        try {
          db.prepare(`DELETE FROM ${table} WHERE family_id = ?`).run(familyIdNum);
        } catch {}
      }

      // 删除相册相关（有依赖顺序）
      try {
        const photos = db.prepare('SELECT id FROM plugin_album_photos WHERE family_id = ?').all(familyIdNum) as { id: number }[];
        for (const photo of photos) {
          db.prepare('DELETE FROM plugin_album_likes WHERE photo_id = ?').run(photo.id);
          db.prepare('DELETE FROM plugin_album_comments WHERE photo_id = ?').run(photo.id);
        }
        db.prepare('DELETE FROM plugin_album_photos WHERE family_id = ?').run(familyIdNum);
        db.prepare('DELETE FROM plugin_album_albums WHERE family_id = ?').run(familyIdNum);
      } catch {}

      // 最后删除家族本身
      db.prepare('DELETE FROM families WHERE id = ?').run(familyIdNum);
    });

    deleteTransaction();

    return NextResponse.json({ success: true, message: '家族刪除成功' });
  } catch (error) {
    console.error('[DELETE FAMILY] Error:', error);
    return NextResponse.json(
      { success: false, error: `刪除失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
      { status: 500 }
    );
  }
}
