-- 家族管家記憶表（每個家族獨立的長期記憶）
CREATE TABLE IF NOT EXISTS plugin_butler_memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_butler_memories_family ON plugin_butler_memories(family_id, category);

-- 管家回覆記錄（避免重複回答相同問題）
CREATE TABLE IF NOT EXISTS plugin_butler_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  trigger_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_butler_replies_family ON plugin_butler_replies(family_id, created_at DESC);
