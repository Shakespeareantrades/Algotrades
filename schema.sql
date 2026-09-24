);

CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pair TEXT NOT NULL,
  side TEXT NOT NULL,
  volume REAL NOT NULL,
  leverage REAL NOT NULL,
  margin REAL NOT NULL,
  entry REAL NOT NULL,
  exit REAL,
  sl REAL,
  tp REAL,
  pl REAL,
  reason TEXT,
  status TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS simulation (
  symbol TEXT PRIMARY KEY,
  price REAL NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
