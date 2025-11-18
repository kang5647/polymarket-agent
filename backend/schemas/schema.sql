DROP TABLE IF EXISTS bots;
CREATE TABLE IF NOT EXISTS bots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  last_activated TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, name)
);

DROP TABLE IF EXISTS market_mover;
CREATE TABLE IF NOT EXISTS market_mover (
  user_id TEXT NOT NULL,
  market_id TEXT NOT NULL,
  market_name TEXT NOT NULL,

  target_yes REAL,   
  target_no REAL,    

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, market_id)
);
