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

        // --- Fingerprinting & Device Approval ---
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || 'Unknown';

        if (visitorId) {
            const fingerprintsRes = await db.execute({
                sql: 'SELECT * FROM user_fingerprints WHERE user_id = ? AND fingerprint = ?',
                args: [user.id, visitorId]
            });
            const fingerprint = fingerprintsRes.rows[0] as any;

            if (!fingerprint) {
                // New device: Enroll but keep unapproved
                await db.execute({
                    sql: 'INSERT INTO user_fingerprints (user_id, fingerprint, label, is_approved, last_ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
                    args: [user.id, visitorId, 'New Device', 0, ip, userAgent]
                });

                // Log the event
                await db.execute({
                    sql: 'INSERT INTO audit_logs (user_id, action, ip_address, device_id, details) VALUES (?, ?, ?, ?, ?)',
                    args: [user.id, 'DEVICE_ENROLLMENT_PENDING', ip, visitorId, JSON.stringify({ userAgent })]
                });

                return NextResponse.json({
                    ok: false,
                    approval_required: true,
                    message: 'Questo dispositivo non è autorizzato. Attendi l\'approvazione dell\'amministratore.'
                }, { status: 403 });
            }

            if (fingerprint.is_approved === 0) {
                // Log attempt
                await db.execute({
                    sql: 'INSERT INTO audit_logs (user_id, action, ip_address, device_id, details) VALUES (?, ?, ?, ?, ?)',
                    args: [user.id, 'LOGIN_BLOCKED_PENDING_APPROVAL', ip, visitorId, JSON.stringify({ userAgent })]
                });

                return NextResponse.json({
                    ok: false,
                    approval_required: true,
                    message: 'Il tuo dispositivo è in attesa di approvazione dall\'amministratore.'
                }, { status: 403 });
            }

            // Approved: Update last used
            await db.execute({
                sql: 'UPDATE user_fingerprints SET last_used = (datetime(\'now\')), last_ip = ?, user_agent = ? WHERE id = ?',
                args: [ip, userAgent, Number(fingerprint.id)]
            });
        }

        // --- Success Logic ---
        const token = signToken({ id: Number(user.id), username: user.username as string, role: user.role as string });

        // Log success
        await db.execute({
            sql: 'INSERT INTO audit_logs (user_id, action, ip_address, device_id) VALUES (?, ?, ?, ?)',
            args: [user.id, 'LOGIN_SUCCESS', ip, visitorId]
        });

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
