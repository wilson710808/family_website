-- 家族树插件
CREATE TABLE IF NOT EXISTS plugin_tree_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'male',
  birth_year INTEGER,
  death_year INTEGER,
  relationship TEXT,
  bio TEXT,
  avatar TEXT,
  parent_ids TEXT,
  spouse_id INTEGER,
  generation INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

CREATE INDEX IF NOT EXISTS idx_tree_members_family ON plugin_tree_members(family_id, generation);
CREATE INDEX IF NOT EXISTS idx_tree_members_parent ON plugin_tree_members(family_id, parent_ids);

-- 家族树关系线
CREATE TABLE IF NOT EXISTS plugin_tree_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  from_member_id INTEGER NOT NULL,
  to_member_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'parent-child',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
