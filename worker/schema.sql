CREATE TABLE IF NOT EXISTS chat_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  outcome TEXT NOT NULL,
  language TEXT NOT NULL,
  message_length INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_events_created_at ON chat_events(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_events_outcome ON chat_events(outcome);
