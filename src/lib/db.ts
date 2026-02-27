import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'recaro.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      company_name TEXT,
      vat TEXT,
      address TEXT,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Evolve schema: add missing columns if they don't exist
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  const columns = tableInfo.map(c => c.name);

  if (!columns.includes('email')) {
    db.prepare("ALTER TABLE users ADD COLUMN email TEXT").run();
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)").run();
  }
  if (!columns.includes('company_name')) {
    db.prepare("ALTER TABLE users ADD COLUMN company_name TEXT").run();
  }
  if (!columns.includes('vat')) {
    db.prepare("ALTER TABLE users ADD COLUMN vat TEXT").run();
  }
  if (!columns.includes('address')) {
    db.prepare("ALTER TABLE users ADD COLUMN address TEXT").run();
  }
  if (!columns.includes('is_active')) {
    db.prepare("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0").run();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS ip_whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT UNIQUE NOT NULL,
      label TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      category TEXT,
      base_price REAL NOT NULL DEFAULT 0,
      image_url TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS seat_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seat_id INTEGER NOT NULL,
      material TEXT NOT NULL,
      colors TEXT NOT NULL,
      price_delta REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS seat_accessories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seat_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      config_json TEXT NOT NULL,
      total_price REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_fingerprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fingerprint TEXT NOT NULL,
      label TEXT,
      last_used TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, fingerprint)
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fingerprint TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL, -- 'MAGO', 'SAP', 'MANUAL'
      status TEXT NOT NULL, -- 'SUCCESS', 'ERROR'
      message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Initialize default API key if not exists
  const hasApiKey = db.prepare('SELECT 1 FROM settings WHERE key = ?').get('SYNC_API_KEY');
  if (!hasApiKey) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('SYNC_API_KEY', 'recaro_sync_secure_2024');
  }
}

export default getDb;
