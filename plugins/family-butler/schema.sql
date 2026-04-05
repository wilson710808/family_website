-- 家族管家插件 - 數據庫結構
-- 聊天記憶表 - 保存所有聊天室對話用於檢索和總結
CREATE TABLE IF NOT EXISTS plugin_butler_chat_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_summarized INTEGER DEFAULT 0
);

-- 索引優化查詢
CREATE INDEX IF NOT EXISTS idx_butler_memory_family_date ON plugin_butler_chat_memory(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_butler_memory_summarized ON plugin_butler_chat_memory(family_id, is_summarized);

-- 計劃提醒表 - 自動識別的提醒事項
CREATE TABLE IF NOT EXISTS plugin_butler_scheduled_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  creator_name TEXT NOT NULL,
  content TEXT NOT NULL,
  remind_date DATE NOT NULL,
  remind_time TIME NULL,
  reminded INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_butler_reminders_date ON plugin_butler_scheduled_reminders(remind_date, reminded);
CREATE INDEX IF NOT EXISTS idx_butler_reminders_family ON plugin_butler_scheduled_reminders(family_id, reminded);

-- 增強公告表 - 帶提醒功能的公告
CREATE TABLE IF NOT EXISTS plugin_butler_announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  creator_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NULL,
  notify_days_before INTEGER DEFAULT 3,
  notified_early INTEGER DEFAULT 0,
  notified_today INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_butler_announcements_date ON plugin_butler_announcements(event_date, notified_early);
CREATE INDEX IF NOT EXISTS idx_butler_announcements_family ON plugin_butler_announcements(family_id);

-- 年度總結表 - 保存年度聊天總結
CREATE TABLE IF NOT EXISTS plugin_butler_annual_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  summary_content TEXT NOT NULL,
  key_topics TEXT NULL, -- JSON 格式保存關鍵主題
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_butler_summary_year_family ON plugin_butler_annual_summaries(family_id, year);

-- 管家配置表
CREATE TABLE IF NOT EXISTS plugin_butler_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL UNIQUE,
  enable_sentiment_detection INTEGER DEFAULT 1,
  enable_auto_task_detection INTEGER DEFAULT 1,
  enable_birthday_greeting INTEGER DEFAULT 1,
  enable_holiday_greeting INTEGER DEFAULT 1,
  model_name TEXT DEFAULT 'meta/llama-3.1-8b-instruct',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 會話上下文表 - 存儲管家對話的上下文記憶
CREATE TABLE IF NOT EXISTS plugin_butler_session_context (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_butler_session_family ON plugin_butler_session_context(family_id, session_id);
CREATE INDEX IF NOT EXISTS idx_butler_session_date ON plugin_butler_session_context(family_id, created_at DESC);

-- 用戶偏好記憶表 - 記住每個用戶的習慣和偏好
CREATE TABLE IF NOT EXISTS plugin_butler_user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(family_id, user_id, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_butler_prefs_user ON plugin_butler_user_preferences(family_id, user_id);
