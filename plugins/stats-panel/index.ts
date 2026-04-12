/**
 * 家族统计面板插件
 * 提供活跃度、贡献排行、词云分析等统计数据
 */
import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 檢查插件是否啟用
export function isEnabled(): boolean {
  return process.env.PLUGIN_STATS_PANEL !== 'false' && process.env.DISABLE_PLUGIN_STATS_PANEL !== 'true';
}

// 初始化數據庫
export function initDatabase(db: Database.Database): void {
  if (!isEnabled()) return;
  try {
    const schemaPath = path.join(process.cwd(), 'plugins/stats-panel/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✅ 家族統計面板插件數據庫初始化完成');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ 家族統計面板插件數據庫已存在');
    } else {
      console.error('❌ 家族統計面板插件數據庫初始化失敗:', error);
      throw error;
    }
  }
}

// ============ 活跃度统计 ============

export function getFamilyActivity(db: Database.Database, familyId: number, days: number = 30): any[] {
  const result = db.prepare(`
    SELECT stat_date, message_count, active_members, new_messages, new_announcements, new_events
    FROM plugin_stats_daily
    WHERE family_id = ? AND stat_date >= date('now', '-' || ? || ' days')
    ORDER BY stat_date ASC
  `).all(familyId, days);
  return result as any[];
}

export function getMemberActivity(db: Database.Database, familyId: number, days: number = 30): any[] {
  const result = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar,
      SUM(msa.message_count) as total_messages,
      SUM(msa.words_typed) as total_words,
      COUNT(DISTINCT msa.stat_date) as active_days
    FROM users u
    JOIN family_members fm ON u.id = fm.user_id
    LEFT JOIN plugin_stats_member_activity msa ON msa.user_id = u.id AND msa.family_id = ?
    WHERE fm.family_id = ? AND fm.status = 'approved'
    AND (msa.stat_date IS NULL OR msa.stat_date >= date('now', '-' || ? || ' days'))
    GROUP BY u.id
    ORDER BY total_messages DESC
  `).all(familyId, familyId, days);
  return result as any[];
}

// ============ 贡献排行 ============

export function getContributionRanking(db: Database.Database, familyId: number, limit: number = 10): any[] {
  const result = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar,
      fm.contribution_points,
      fm.contribution_stars,
      COUNT(DISTINCT m.id) as message_count,
      COUNT(DISTINCT a.id) as announcement_count
    FROM users u
    JOIN family_members fm ON u.id = fm.user_id
    LEFT JOIN messages m ON m.user_id = u.id AND m.family_id = ?
    LEFT JOIN announcements a ON a.user_id = u.id AND a.family_id = ?
    WHERE fm.family_id = ? AND fm.status = 'approved'
    GROUP BY u.id
    ORDER BY fm.contribution_points DESC, message_count DESC
    LIMIT ?
  `).all(familyId, familyId, familyId, limit);
  return result as any[];
}

// ============ 词云分析 ============

export function getWordCloud(db: Database.Database, familyId: number, limit: number = 50): any[] {
  const result = db.prepare(`
    SELECT word, count
    FROM plugin_stats_word_cloud
    WHERE family_id = ? AND count >= 2
    ORDER BY count DESC
    LIMIT ?
  `).all(familyId, limit);
  return result as any[];
}

export function updateWordCloud(db: Database.Database, familyId: number, words: string[]): void {
  const stmt = db.prepare(`
    INSERT INTO plugin_stats_word_cloud (family_id, word, count, last_seen)
    VALUES (?, ?, 1, date('now'))
    ON CONFLICT(family_id, word) 
    DO UPDATE SET 
      count = count + 1,
      last_seen = date('now')
  `);
  
  for (const word of words) {
    if (word.length >= 2) {
      stmt.run(familyId, word);
    }
  }
}

// ============ 综合统计 ============

export function getFamilyStatsOverview(db: Database.Database, familyId: number): any {
  // 总消息数
  const totalMessages = db.prepare(`
    SELECT COUNT(*) as count FROM messages WHERE family_id = ?
  `).pluck().get(familyId) as number;

  // 总公告数
  const totalAnnouncements = db.prepare(`
    SELECT COUNT(*) as count FROM announcements WHERE family_id = ?
  `).pluck().get(familyId) as number;

  // 总事件数
  let totalEvents = 0;
  try {
    totalEvents = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_calendar_events WHERE family_id = ?
    `).pluck().get(familyId) as number;
  } catch {}

  // 总照片数
  let totalPhotos = 0;
  try {
    totalPhotos = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_album_photos WHERE family_id = ?
    `).pluck().get(familyId) as number;
  } catch {}

  // 成员数
  const memberCount = db.prepare(`
    SELECT COUNT(*) as count FROM family_members WHERE family_id = ? AND status = 'approved'
  `).pluck().get(familyId) as number;

  // 本周活跃度
  const weeklyActive = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM messages
    WHERE family_id = ? AND created_at >= datetime('now', '-7 days')
  `).pluck().get(familyId) as number;

  // 今日活跃度
  const todayActive = db.prepare(`
    SELECT COUNT(*) as count
    FROM messages
    WHERE family_id = ? AND date(created_at) = date('now')
  `).pluck().get(familyId) as number;

  return {
    totalMessages,
    totalAnnouncements,
    totalEvents,
    totalPhotos,
    memberCount,
    weeklyActive,
    todayActive,
  };
}

// ============ 每日统计生成 ============

export function generateDailyStats(db: Database.Database, familyId: number, date: string): void {
  // 消息数统计
  const messageCount = db.prepare(`
    SELECT COUNT(*) as count FROM messages
    WHERE family_id = ? AND date(created_at) = ?
  `).pluck().get(familyId, date) as number;

  // 活跃成员数
  const activeMembers = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM messages
    WHERE family_id = ? AND date(created_at) = ?
  `).pluck().get(familyId, date) as number;

  // 新公告数
  const newAnnouncements = db.prepare(`
    SELECT COUNT(*) as count FROM announcements
    WHERE family_id = ? AND date(created_at) = ?
  `).pluck().get(familyId, date) as number;

  // 新事件数
  let newEvents = 0;
  try {
    newEvents = db.prepare(`
      SELECT COUNT(*) as count FROM plugin_calendar_events
      WHERE family_id = ? AND date(created_at) = ?
    `).pluck().get(familyId, date) as number;
  } catch {}

  // 插入或更新每日统计
  db.prepare(`
    INSERT INTO plugin_stats_daily (family_id, stat_date, message_count, active_members, new_messages, new_announcements, new_events)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(family_id, stat_date)
    DO UPDATE SET
      message_count = excluded.message_count,
      active_members = excluded.active_members,
      new_messages = excluded.new_messages,
      new_announcements = excluded.new_announcements,
      new_events = excluded.new_events
  `).run(familyId, date, messageCount, activeMembers, messageCount, newAnnouncements, newEvents);
}

export default {
  name: 'stats-panel',
  displayName: '統計面板',
  description: '家族活躍度統計、貢獻排行、詞雲分析',
  isEnabled,
  initDatabase,
  getFamilyActivity,
  getMemberActivity,
  getContributionRanking,
  getWordCloud,
  updateWordCloud,
  getFamilyStatsOverview,
  generateDailyStats,
};
