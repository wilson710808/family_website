-- 数据库性能优化 - 添加索引
-- 执行此脚本可加速常用查询

-- 核心表索引
CREATE INDEX IF NOT EXISTS idx_messages_family_created ON messages(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_family ON announcements(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);

-- 聊天消息索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_family ON chat_messages(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- 管家相关索引
CREATE INDEX IF NOT EXISTS idx_butler_replies_family ON plugin_butler_replies(family_id, created_at DESC);

-- 日历事件索引
CREATE INDEX IF NOT EXISTS idx_calendar_events_family ON plugin_calendar_events(family_id, start_time);

-- 家族树索引
CREATE INDEX IF NOT EXISTS idx_tree_members_family ON plugin_tree_members(family_id);
CREATE INDEX IF NOT EXISTS idx_tree_members_user ON plugin_tree_members(user_id);

-- 文档库索引
CREATE INDEX IF NOT EXISTS idx_document_files_family ON plugin_document_files(family_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_family ON plugin_document_folders(family_id);

-- 通知索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON plugin_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_family ON plugin_notifications(family_id);

-- 成长专栏索引
CREATE INDEX IF NOT EXISTS idx_growth_history_family ON plugin_growth_book_history(family_id);
CREATE INDEX IF NOT EXISTS idx_growth_favorites_user ON plugin_growth_book_favorites(user_id);

-- 社交化索引
CREATE INDEX IF NOT EXISTS idx_family_books_family ON plugin_growth_family_books(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_notes_family ON plugin_growth_reading_notes(family_id, book_name);
CREATE INDEX IF NOT EXISTS idx_reading_notes_user ON plugin_growth_reading_notes(user_id);

-- 统计面板索引
CREATE INDEX IF NOT EXISTS idx_stats_daily_family_date ON plugin_stats_daily(family_id, stat_date);

-- 用户登录日志索引（检查列名）
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON user_login_logs(user_id);

-- 分析数据库完整性
ANALYZE;
