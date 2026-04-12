-- 家族文档库插件数据库结构

-- 文档文件夹
CREATE TABLE IF NOT EXISTS plugin_document_folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    parent_id INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (parent_id) REFERENCES plugin_document_folders(id)
);

-- 文档文件
CREATE TABLE IF NOT EXISTS plugin_document_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    folder_id INTEGER,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    description TEXT,
    uploaded_by INTEGER NOT NULL,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (folder_id) REFERENCES plugin_document_folders(id)
);

-- 文件访问权限（可选：设置特定成员的访问权限）
CREATE TABLE IF NOT EXISTS plugin_document_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    can_view INTEGER DEFAULT 1,
    can_download INTEGER DEFAULT 1,
    can_delete INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES plugin_document_files(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_document_folders_family ON plugin_document_folders(family_id);
CREATE INDEX IF NOT EXISTS idx_document_files_family ON plugin_document_files(family_id);
CREATE INDEX IF NOT EXISTS idx_document_files_folder ON plugin_document_files(folder_id);
