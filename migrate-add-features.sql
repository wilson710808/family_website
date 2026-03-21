-- 家族网站特色功能数据库迁移
-- 1. 为 family_members 添加关系称谓和贡献度字段
ALTER TABLE family_members ADD COLUMN relationship TEXT; -- 关系称谓，如：爸爸、妈妈、儿子、女儿等
ALTER TABLE family_members ADD COLUMN contribution_points INTEGER DEFAULT 0; -- 贡献积分
ALTER TABLE family_members ADD COLUMN contribution_stars INTEGER DEFAULT 1; -- 贡献星级 (1-5)

-- 2. 创建聊天消息已读记录表
CREATE TABLE IF NOT EXISTS chat_message_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES chat_messages(id),
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(message_id, user_id)
);

-- 3. 为创建者设置二星起步（符合要求：一家之主就是二星起跳）
UPDATE family_members 
SET contribution_stars = 2, contribution_points = 100
WHERE role = 'admin' AND (contribution_stars IS NULL OR contribution_stars = 1);

-- 显示更新结果
SELECT 'Updated ' || changes() || ' admin members to 2 stars' AS result;
