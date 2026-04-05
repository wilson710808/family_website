-- ============================================
-- 家族相册插件 - 数据库结构
-- 可插拔设计：独立表，禁用时可直接删除表
-- ============================================

-- 相册表
CREATE TABLE IF NOT EXISTS plugin_album_albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    created_by INTEGER NOT NULL,
    is_public INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 照片表
CREATE TABLE IF NOT EXISTS plugin_album_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    family_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    title TEXT,
    description TEXT,
    tags TEXT, -- JSON array of tags
    uploaded_by INTEGER NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    taken_at TEXT, -- 拍摄日期
    is_enabled INTEGER DEFAULT 1
);

-- 照片点赞表
CREATE TABLE IF NOT EXISTS plugin_album_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photo_id, user_id)
);

-- 照片评论表
CREATE TABLE IF NOT EXISTS plugin_album_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_enabled INTEGER DEFAULT 1
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_album_family ON plugin_album_albums(family_id);
CREATE INDEX IF NOT EXISTS idx_photos_album ON plugin_album_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_family ON plugin_album_photos(family_id);
CREATE INDEX IF NOT EXISTS idx_photos_date ON plugin_album_photos(taken_at);
