import { createClient } from '@libsql/client';

async function main() {
    const url = process.env.TURSO_DATABASE_URL || 'libsql://recaro-matte58subito2-ui.turso.io';
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!authToken) {
        console.error('Turso auth token is missing');
        process.exit(1);
    }

    const db = createClient({ url, authToken });

    console.log('Connecting to Turso...');

    try {
        await db.execute(`CREATE TABLE IF NOT EXISTS ip_whitelist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT UNIQUE NOT NULL,
            label TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )`);

        console.log('✅ Turso Database OK: ip_whitelist table ensured.');
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
}

main();
