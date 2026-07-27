CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  stage TEXT DEFAULT 'catch',
  first_message_at TEXT NOT NULL,
  last_message_at TEXT NOT NULL,
  is_blocked INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL REFERENCES contacts(id),
  direction TEXT NOT NULL,
  source TEXT,
  content TEXT NOT NULL,
  line_message_id TEXT,
  sent_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL REFERENCES contacts(id),
  trigger_message_id INTEGER REFERENCES messages(id),
  ai_content TEXT NOT NULL,
  edited_content TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS operators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id, created_at);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status, created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_line_id ON contacts(line_user_id);

INSERT OR IGNORE INTO settings (key, value) VALUES ('reply_mode', 'semi-auto');
INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_model', 'claude-haiku-4-5-20251001');
