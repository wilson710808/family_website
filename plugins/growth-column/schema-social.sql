-- 成长专栏社交化扩展

-- 家族书单（家族共享推荐书籍）
CREATE TABLE IF NOT EXISTS plugin_growth_family_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    book_name TEXT NOT NULL,
    author TEXT,
    category TEXT,
    description TEXT,
    recommend_reason TEXT,  -- 推荐理由
    is_featured INTEGER DEFAULT 0,  -- 是否精选推荐
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_id, book_name)
);

-- 读书笔记
CREATE TABLE IF NOT EXISTS plugin_growth_reading_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    book_name TEXT NOT NULL,
    chapter TEXT,  -- 章节
    note_type TEXT DEFAULT 'thought',  -- thought/quote/summary
    content TEXT NOT NULL,
    page_number INTEGER,
    is_shared INTEGER DEFAULT 1,  -- 是否分享给家族
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 笔记点赞
CREATE TABLE IF NOT EXISTS plugin_growth_note_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(note_id, user_id)
);

-- 家族书单点赞
CREATE TABLE IF NOT EXISTS plugin_growth_family_book_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_book_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(family_book_id, user_id)
);

-- 评论
CREATE TABLE IF NOT EXISTS plugin_growth_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,  -- 'family_book' / 'reading_note'
    target_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_family_books ON plugin_growth_family_books(family_id);
CREATE INDEX IF NOT EXISTS idx_reading_notes ON plugin_growth_reading_notes(family_id, book_name);
CREATE INDEX IF NOT EXISTS idx_note_likes ON plugin_growth_note_likes(note_id);
CREATE INDEX IF NOT EXISTS idx_comments ON plugin_growth_comments(target_type, target_id);
