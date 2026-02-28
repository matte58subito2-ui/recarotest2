import { NextRequest, NextResponse } from 'next/server';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import getDb from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { username, visitorId, otp } = await request.json();

        if (!username || !visitorId || !otp) {
            return NextResponse.json({ error: 'Missing information' }, { status: 400 });
        }

        const db = getDb();
        const userRes = await db.execute({
            sql: 'SELECT * FROM users WHERE username = ?',
            args: [username]
        });
        const user = userRes.rows[0];

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const verificationRes = await db.execute({
            sql: 'SELECT * FROM otp_verifications WHERE user_id = ? AND fingerprint = ?',
            args: [Number(user.id), visitorId]
        });
        const verification = verificationRes.rows[0];

        if (!verification) {
            return NextResponse.json({ error: 'No active verification found' }, { status: 400 });
        }

        if (Number(verification.attempts) >= 5) {
            await db.execute({
                sql: 'DELETE FROM otp_verifications WHERE id = ?',
                args: [Number(verification.id)]
            });
            return NextResponse.json({ error: 'Troppi tentativi falliti. Richiedi un nuovo codice.' }, { status: 403 });
        }

        if (new Date() > new Date(verification.expires_at as string)) {
            return NextResponse.json({ error: 'Codice di verifica scaduto' }, { status: 400 });
        }

        if (verification.otp_code !== otp) {
            const newAttempts = Number(verification.attempts || 0) + 1;
            if (newAttempts >= 5) {
                await db.execute({
                    sql: 'DELETE FROM otp_verifications WHERE id = ?',
                    args: [Number(verification.id)]
                });
                return NextResponse.json({ error: 'Troppi tentativi falliti. Il codice è stato rimosso.' }, { status: 403 });
            } else {
                await db.execute({
                    sql: 'UPDATE otp_verifications SET attempts = ? WHERE id = ?',
                    args: [newAttempts, Number(verification.id)]
                });
                return NextResponse.json({ error: `Codice non valido. Tentativi rimasti: ${5 - newAttempts}` }, { status: 400 });
            }
        }


        // Success: Authorize the device
        await db.execute({
            sql: 'INSERT OR REPLACE INTO user_fingerprints (user_id, fingerprint, label) VALUES (?, ?, ?)',
            args: [Number(user.id), visitorId, 'Authorized Device']
        });

        // Cleanup OTP
        await db.execute({
            sql: 'DELETE FROM otp_verifications WHERE id = ?',
            args: [Number(verification.id)]
        });

        // Sign token and login
        const token = signToken({ id: Number(user.id), username: user.username as string, role: user.role as string });

        const response = NextResponse.json({ ok: true, role: user.role });
        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 8, // 8 hours
            path: '/',
        });

        console.log(`[AUTH] Device ${visitorId} authorized for ${username} via OTP.`);
        return response;
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
