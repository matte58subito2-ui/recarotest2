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
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const verification = db.prepare('SELECT * FROM otp_verifications WHERE user_id = ? AND fingerprint = ?').get(user.id, visitorId) as any;

        if (!verification) {
            return NextResponse.json({ error: 'No active verification found' }, { status: 400 });
        }

        if (new Date() > new Date(verification.expires_at)) {
            return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
        }

        if (verification.otp_code !== otp) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        // Success: Authorize the device
        db.prepare('INSERT OR REPLACE INTO user_fingerprints (user_id, fingerprint, label) VALUES (?, ?, ?)')
            .run(user.id, visitorId, 'Authorized Device');

        // Cleanup OTP
        db.prepare('DELETE FROM otp_verifications WHERE id = ?').run(verification.id);

        // Sign token and login
        const token = signToken({ id: user.id, username: user.username, role: user.role });

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
