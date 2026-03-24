-- 成长专栏 - AI书籍导读插件数据库结构
-- 创建用户阅读历史表
CREATE TABLE IF NOT EXISTS plugin_growth_book_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  user_id INTEGER,
  book_name TEXT NOT NULL,
  author TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(family_id, book_name, user_id)
);

-- 创建收藏表
CREATE TABLE IF NOT EXISTS plugin_growth_book_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  user_id INTEGER,
  book_name TEXT NOT NULL,
  author TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(family_id, book_name, user_id)
);

-- 创建预定义推荐书单表
CREATE TABLE IF NOT EXISTS plugin_growth_book_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  book_name TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  is_enabled INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
