import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isUserInFamily } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未登錄' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const type = searchParams.get('type') || 'overview';
    const days = parseInt(searchParams.get('days') || '30');

    if (!familyId) {
      return NextResponse.json({ error: '缺少 familyId' }, { status: 400 });
    }

    const fid = Number(familyId);

    const inFamily = await isUserInFamily(user.id, fid);
    if (!inFamily) {
      return NextResponse.json({ error: '你不是該家族成員' }, { status: 403 });
    }

    if (type === 'overview') {
      const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE family_id = ?').pluck().get(fid) as number;
      const totalChatMessages = db.prepare('SELECT COUNT(*) as count FROM chat_messages WHERE family_id = ?').pluck().get(fid) as number;
      const totalMembers = db.prepare("SELECT COUNT(*) as count FROM family_members WHERE family_id = ? AND status = 'approved'").pluck().get(fid) as number;
      const totalAlbums = db.prepare('SELECT COUNT(*) as count FROM plugin_album_albums WHERE family_id = ?').pluck().get(fid) as number;

      return NextResponse.json({
        success: true,
        type: 'overview',
        data: { totalMessages, totalChatMessages, totalMembers, totalAlbums },
      });
    }

    if (type === 'activity') {
      const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      const dailyActivity = db.prepare(`
        SELECT date, message_count, chat_count, active_users
        FROM plugin_stats_daily
        WHERE family_id = ? AND date >= ?
        ORDER BY date ASC
      `).all(fid, since);

      return NextResponse.json({ success: true, type: 'activity', data: dailyActivity });
    }

    if (type === 'ranking') {
      const ranking = db.prepare(`
        SELECT u.name, u.avatar, fm.contribution_points, fm.contribution_stars
        FROM family_members fm
        JOIN users u ON fm.user_id = u.id
        WHERE fm.family_id = ? AND fm.status = 'approved'
        ORDER BY fm.contribution_points DESC
        LIMIT 20
      `).all(fid);

      return NextResponse.json({ success: true, type: 'ranking', data: ranking });
    }

    if (type === 'wordcloud') {
      const words = db.prepare(`
        SELECT word, count FROM plugin_stats_word_cloud
        WHERE family_id = ?
        ORDER BY count DESC
        LIMIT 50
      `).all(fid);

      return NextResponse.json({ success: true, type: 'wordcloud', data: words });
    }

    return NextResponse.json({ error: '未知的統計類型' }, { status: 400 });
  } catch (error) {
    console.error('[Stats API] GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
