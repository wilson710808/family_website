-- 家族统计面板插件数据库结构

-- 统计数据缓存表（每日汇总）
CREATE TABLE IF NOT EXISTS plugin_stats_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    stat_date DATE NOT NULL,
    message_count INTEGER DEFAULT 0,
    active_members INTEGER DEFAULT 0,
    new_messages INTEGER DEFAULT 0,
    new_announcements INTEGER DEFAULT 0,
    new_events INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_id, stat_date)
);

-- 成员活动统计
CREATE TABLE IF NOT EXISTS plugin_stats_member_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    stat_date DATE NOT NULL,
    message_count INTEGER DEFAULT 0,
    login_count INTEGER DEFAULT 0,
    words_typed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_id, user_id, stat_date)
);

-- 聊天词云数据
CREATE TABLE IF NOT EXISTS plugin_stats_word_cloud (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    last_seen DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_id, word)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_stats_daily_family ON plugin_stats_daily(family_id, stat_date);
CREATE INDEX IF NOT EXISTS idx_stats_member ON plugin_stats_member_activity(family_id, user_id);
CREATE INDEX IF NOT EXISTS idx_stats_word ON plugin_stats_word_cloud(family_id, count DESC);
