-- 家族树用户绑定迁移
-- 添加 user_id 字段用于关联实际用户账号

ALTER TABLE plugin_tree_members ADD COLUMN user_id INTEGER;
ALTER TABLE plugin_tree_members ADD COLUMN is_registered INTEGER DEFAULT 0;

-- 创建索引以加速用户查询
CREATE INDEX IF NOT EXISTS idx_tree_members_user ON plugin_tree_members(user_id);
