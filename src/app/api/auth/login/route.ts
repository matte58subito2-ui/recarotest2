import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import getDb from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { username, password, visitorId } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const db = getDb();
        const userRes = await db.execute({
            sql: 'SELECT * FROM users WHERE username = ?',
            args: [username]
        });
        const user = userRes.rows[0] as any;

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return NextResponse.json({ error: 'Username o password non validi' }, { status: 401 });
        }

        // Check if account is active
        if (user.is_active === 0) {
            return NextResponse.json({ error: 'Il tuo account è in attesa di approvazione dall\'amministratore' }, { status: 403 });
        }

        // --- Fingerprinting Logic ---
        if (visitorId) {
            const fingerprintsRes = await db.execute({
                sql: 'SELECT * FROM user_fingerprints WHERE user_id = ?',
                args: [user.id]
            });
            const fingerprints = fingerprintsRes.rows as any[];

            const isAuthorized = fingerprints.some(f => f.fingerprint === visitorId);

            if (fingerprints.length === 0) {
                // First device: auto-authorize
                await db.execute({
                    sql: 'INSERT INTO user_fingerprints (user_id, fingerprint, label) VALUES (?, ?, ?)',
                    args: [user.id, visitorId, 'Primary Device']
                });
                console.log(`[AUTH] First device authorized for ${username}: ${visitorId}`);
            } else if (!isAuthorized) {
                // New device: trigger OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

                // Delete old OTPs for this user
                await db.execute({
                    sql: 'DELETE FROM otp_verifications WHERE user_id = ?',
                    args: [user.id]
                });

                await db.execute({
                    sql: 'INSERT INTO otp_verifications (user_id, fingerprint, otp_code, expires_at) VALUES (?, ?, ?, ?)',
                    args: [user.id, visitorId, otp, expiresAt]
                });

                console.log(`\n--- [SECURITY ALERT] ---`);
                console.log(`New device detected for user: ${username}`);
                console.log(`Device ID: ${visitorId}`);
                console.log(`Generated OTP code: ${otp}`);
                console.log(`--- [LOGGED TO CONSOLE FOR B2B DEMO] ---\n`);

                return NextResponse.json({
                    ok: false,
                    mfa_required: true,
                    message: 'New device detected. Please enter the verification code sent to your email.'
                });
            } else {
                // Update last used
                await db.execute({
                    sql: 'UPDATE user_fingerprints SET last_used = (datetime(\'now\')) WHERE user_id = ? AND fingerprint = ?',
                    args: [user.id, visitorId]
                });
            }
        }

        const token = signToken({ id: Number(user.id), username: user.username as string, role: user.role as string });

        const response = NextResponse.json({ ok: true, role: user.role });
        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 8, // 8 hours
            path: '/',
        });
        return response;
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
