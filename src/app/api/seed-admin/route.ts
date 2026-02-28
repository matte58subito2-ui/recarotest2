import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const db = getDb();

        const email = 'info@recaro.com';
        const username = 'admin';
        const password = 'RecaroAdmin2026!';

        const passwordHash = await bcrypt.hash(password, 10);

        const res = await db.execute({
            sql: 'SELECT id FROM users WHERE username = ? OR email = ?',
            args: [username, email]
        });

        if (res.rows.length > 0) {
            await db.execute({
                sql: "UPDATE users SET password_hash = ?, is_active = 1, role = 'admin' WHERE id = ?",
                args: [passwordHash, res.rows[0].id]
            });
            return NextResponse.json({ message: 'Account admin aggiornato con successo!', success: true });
        } else {
            await db.execute({
                sql: `INSERT INTO users (username, email, password_hash, role, company_name, is_active) 
                      VALUES (?, ?, ?, 'admin', 'RECARO Admin', 1)`,
                args: [username, email, passwordHash]
            });
            return NextResponse.json({ message: 'Account admin creato con successo!', success: true });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message, success: false });
    }
}
