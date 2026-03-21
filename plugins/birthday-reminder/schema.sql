-- ============================================
-- 生日/纪念日提醒插件 - 数据库结构
-- 可插拔设计：独立表，禁用时可直接删除表
-- ============================================

-- 用户生日和纪念日表
CREATE TABLE IF NOT EXISTS plugin_birthday_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,          -- 对应用户ID
    family_id INTEGER NOT NULL,        -- 所属家族ID
    reminder_type TEXT NOT NULL,       -- 类型: 'birthday' 生日, 'anniversary' 纪念日, 'custom' 自定义
    title TEXT NOT NULL,               -- 标题: 生日 / 结婚纪念日等
    birth_date TEXT NOT NULL,          -- 日期 (格式: MM-DD 用于每年提醒；YYYY-MM-DD 存储完整日期算年龄)
    year INTEGER,                      -- 出生/起始年份 (可选，用于计算年龄/周年)
    is_enabled INTEGER DEFAULT 1,      -- 是否启用
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, family_id, birth_date, reminder_type)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_birthday_family ON plugin_birthday_reminders(family_id);
CREATE INDEX IF NOT EXISTS idx_birthday_user ON plugin_birthday_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_birthday_date ON plugin_birthday_reminders(birth_date);

-- 提醒设置表 (每个用户每个家族的设置)
CREATE TABLE IF NOT EXISTS plugin_birthday_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    remind_days_before INTEGER DEFAULT 1, -- 提前几天提醒
    notify_on_birthday_day INTEGER DEFAULT 1, -- 当天是否提醒
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_id, user_id)
);
