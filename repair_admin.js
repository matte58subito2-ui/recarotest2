const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const path = require('path');

async function run() {
    const password = 'admin123';
    const hash = bcrypt.hashSync(password, 10);
    const url = "libsql://recaro-prod-matte58subito2-ui.aws-eu-west-1.turso.io";
    const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzIyMTkwMjMsImlkIjoiMDE5Y2EwN2MtMTcwMS03M2QyLWI3MjUtNzZjYWE1OTczZDIyIiwicmlkIjoiY2M1MGE3YzQtNjhkMy00YzI4LTkyYjUtNDFjNDJlMGJiOWMxIn0.2rukVfZRUfJ29D3vUmJF9CXC8qC8AP6QEfWkJmyFoyttEt8UhkIqxN8Q_pRjjK0JbtU4A2V_3CWHKaGYy_hpCQ";

    const turso = createClient({ url, authToken });
    const local = createClient({ url: `file:${path.join(__dirname, 'data', 'recaro.db')}` });

    const targets = [
        { name: 'TURSO', client: turso },
        { name: 'LOCAL', client: local }
    ];

    for (const target of targets) {
        console.log(`--- SYNCING ${target.name} ---`);
        try {
            // 1. Ensure user 'admin' exists
            await target.client.execute({
                sql: "UPDATE users SET password_hash = ?, role = 'admin', is_active = 1 WHERE username = 'admin' OR email = 'admin@recaro.com'",
                args: [hash]
            });

            await target.client.execute({
                sql: "INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)",
                args: ['admin', 'admin@recaro.com', hash, 'admin', 1]
            });

            // 2. Approve ALL fingerprints for anyone with role admin
            await target.client.execute(`
                UPDATE user_fingerprints 
                SET is_approved = 1 
                WHERE user_id IN (SELECT id FROM users WHERE role = 'admin')
            `);

            // 3. Ensure tables exist (especially audit_logs)
            await target.client.execute(`CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                ip_address TEXT,
                device_id TEXT,
                details TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )`);

            console.log(`${target.name} synced successfully.`);
        } catch (err) {
            console.error(`Error syncing ${target.name}:`, err.message);
        }
    }
}

run();
