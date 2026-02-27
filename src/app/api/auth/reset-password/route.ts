import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { token, newPassword } = await request.json();
        if (!token || !newPassword) {
            return NextResponse.json({ error: 'Token and new password required' }, { status: 400 });
        }

        const db = getDb();
        const resetRes = await db.execute({
            sql: `SELECT * FROM password_resets 
                  WHERE token = ? AND used_at IS NULL 
                  AND expires_at > (datetime('now'))`,
            args: [token]
        });
        const reset = resetRes.rows[0];

        if (!reset) {
            return NextResponse.json({ error: 'Token non valido o scaduto.' }, { status: 400 });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // 1. Update password
        await db.execute({
            sql: 'UPDATE users SET password_hash = ?, revoked_all_at = (datetime(\'now\')) WHERE id = ?',
            args: [hashedPassword, Number(reset.user_id)]
        });

        // 2. Mark token as used
        await db.execute({
            sql: 'UPDATE password_resets SET used_at = (datetime(\'now\')) WHERE id = ?',
            args: [Number(reset.id)]
        });

        // 3. Audit log
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await db.execute({
            sql: 'INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            args: [Number(reset.user_id), 'PASSWORD_RESET_SUCCESS', ip]
        });

        return NextResponse.json({ ok: true, message: 'Password aggiornata con successo. Ora puoi accedere.' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
