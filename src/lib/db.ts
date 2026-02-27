import { createClient, Client } from '@libsql/client';

let client: Client | null = null;

export function getDb(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL || `file:${process.cwd()}/data/recaro.db`;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  client = createClient({
    url,
    authToken,
  });

  return client;
}

export async function initSchema() {
  const db = getDb();

  // Check if tables exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      company_name TEXT,
      vat TEXT,
      address TEXT,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Evolve schema
  const result = await db.execute("PRAGMA table_info(users)");
  const columns = result.rows.map(c => c.name as string);

  if (!columns.includes('email')) {
    await db.execute("ALTER TABLE users ADD COLUMN email TEXT");
    await db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  }
  if (!columns.includes('company_name')) {
    await db.execute("ALTER TABLE users ADD COLUMN company_name TEXT");
  }
  if (!columns.includes('vat')) {
    await db.execute("ALTER TABLE users ADD COLUMN vat TEXT");
  }
  if (!columns.includes('address')) {
    await db.execute("ALTER TABLE users ADD COLUMN address TEXT");
  }
  if (!columns.includes('is_active')) {
    await db.execute("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0");
  }

  await db.execute(`
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
      price_delta REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS seat_accessories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seat_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      config_json TEXT NOT NULL,
      total_price REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_fingerprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fingerprint TEXT NOT NULL,
      label TEXT,
      last_used TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, fingerprint)
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fingerprint TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Initialize default API key if not exists
  const hasApiKeyRes = await db.execute({
    sql: 'SELECT 1 FROM settings WHERE key = ?',
    args: ['SYNC_API_KEY']
  });

  if (hasApiKeyRes.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO settings (key, value) VALUES (?, ?)',
      args: ['SYNC_API_KEY', 'recaro_sync_secure_2024']
    });
  }
}

export default getDb;
