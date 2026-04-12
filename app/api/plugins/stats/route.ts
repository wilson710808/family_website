import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 获取家族统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const type = searchParams.get('type') || 'overview';
    const days = parseInt(searchParams.get('days') || '30');

    if (!familyId) {
      return NextResponse.json({ error: '缺少 familyId' }, { status: 400 });
    }

    const fid = Number(familyId);

    if (type === 'overview') {
      // 综合概览
      const totalMessages = db.prepare(`
        SELECT COUNT(*) as count FROM messages WHERE family_id = ?
      `).pluck().get(fid) as number;

      const totalAnnouncements = db.prepare(`
        SELECT COUNT(*) as count FROM announcements WHERE family_id = ?
      `).pluck().get(fid) as number;

      let totalEvents = 0;
      try {
        totalEvents = db.prepare(`
          SELECT COUNT(*) as count FROM plugin_calendar_events WHERE family_id = ?
        `).pluck().get(fid) as number;
      } catch {}

      let totalPhotos = 0;
      try {
        totalPhotos = db.prepare(`
          SELECT COUNT(*) as count FROM plugin_album_photos WHERE family_id = ?
        `).pluck().get(fid) as number;
      } catch {}

      const memberCount = db.prepare(`
        SELECT COUNT(*) as count FROM family_members WHERE family_id = ? AND status = 'approved'
      `).pluck().get(fid) as number;

      const weeklyActive = db.prepare(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM messages
        WHERE family_id = ? AND created_at >= datetime('now', '-7 days')
      `).pluck().get(fid) as number;

      const todayActive = db.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE family_id = ? AND date(created_at) = date('now')
      `).pluck().get(fid) as number;

      return NextResponse.json({
        success: true,
        stats: {
          totalMessages,
          totalAnnouncements,
          totalEvents,
          totalPhotos,
          memberCount,
          weeklyActive,
          todayActive,
        },
      });
    }

    if (type === 'activity') {
      // 活跃度趋势
      const result = db.prepare(`
        SELECT stat_date, message_count, active_members, new_messages
        FROM plugin_stats_daily
        WHERE family_id = ? AND stat_date >= date('now', '-' || ? || ' days')
        ORDER BY stat_date ASC
      `).all(fid, days);

      // 如果没有统计缓存，实时计算
      if (result.length === 0) {
        const realTimeData = db.prepare(`
          SELECT 
            date(created_at) as stat_date,
            COUNT(*) as message_count,
            COUNT(DISTINCT user_id) as active_members
          FROM messages
          WHERE family_id = ? AND created_at >= datetime('now', '-' || ? || ' days')
          GROUP BY date(created_at)
          ORDER BY stat_date ASC
        `).all(fid, days);

        return NextResponse.json({
          success: true,
          activity: realTimeData,
          source: 'realtime',
        });
      }

      return NextResponse.json({
        success: true,
        activity: result,
        source: 'cached',
      });
    }

    if (type === 'ranking') {
      // 贡献排行
      const ranking = db.prepare(`
        SELECT 
          u.id, u.name, u.avatar,
          fm.contribution_points,
          fm.contribution_stars,
          (SELECT COUNT(*) FROM messages WHERE user_id = u.id AND family_id = ?) as message_count,
          (SELECT COUNT(*) FROM announcements WHERE user_id = u.id AND family_id = ?) as announcement_count
        FROM users u
        JOIN family_members fm ON u.id = fm.user_id
        WHERE fm.family_id = ? AND fm.status = 'approved'
        ORDER BY fm.contribution_points DESC, message_count DESC
        LIMIT 20
      `).all(fid, fid, fid);

      return NextResponse.json({
        success: true,
        ranking,
      });
    }

    if (type === 'wordcloud') {
      // 词云数据
      let wordCloud: any[] = [];
      try {
        wordCloud = db.prepare(`
          SELECT word, count
          FROM plugin_stats_word_cloud
          WHERE family_id = ? AND count >= 2
          ORDER BY count DESC
          LIMIT 100
        `).all(fid) as any[];
      } catch {
        // 表不存在时返回空
      }

      return NextResponse.json({
        success: true,
        wordCloud,
      });
    }

    return NextResponse.json({ error: '未知统计类型' }, { status: 400 });
  } catch (error) {
    console.error('获取统计失败:', error);
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}
