-- 通知系统数据库结构

-- 通知表
CREATE TABLE IF NOT EXISTS plugin_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'birthday', 'event', 'message', 'announcement', 'reminder', 'system'
    title TEXT NOT NULL,
    content TEXT,
    link TEXT, -- 点击通知跳转的链接
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- 通知设置表
CREATE TABLE IF NOT EXISTS plugin_notification_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    notify_birthday INTEGER DEFAULT 1,
    notify_event INTEGER DEFAULT 1,
    notify_message INTEGER DEFAULT 1,
    notify_announcement INTEGER DEFAULT 1,
    notify_reminder INTEGER DEFAULT 1,
    push_enabled INTEGER DEFAULT 0, -- 浏览器推送开关
    email_enabled INTEGER DEFAULT 0, -- 邮件通知开关
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_id, user_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notifications_user ON plugin_notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_family ON plugin_notifications(family_id, created_at);
