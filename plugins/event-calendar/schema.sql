-- 事件日历插件
CREATE TABLE IF NOT EXISTS plugin_calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'general',
  location TEXT,
  start_at DATETIME NOT NULL,
  end_at DATETIME,
  is_all_day INTEGER DEFAULT 0,
  is_recurring INTEGER DEFAULT 0,
  recurrence_rule TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_family ON plugin_calendar_events(family_id, start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON plugin_calendar_events(family_id, event_type);

-- 事件参与记录
CREATE TABLE IF NOT EXISTS plugin_calendar_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  responded_at DATETIME,
  FOREIGN KEY (event_id) REFERENCES plugin_calendar_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_participants_event ON plugin_calendar_participants(event_id);
