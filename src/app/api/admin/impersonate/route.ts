import { NextRequest, NextResponse } from 'next/server';
import { getSession, signToken, COOKIE_NAME } from '@/lib/auth';
import getDb from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const adminSession = await getSession();
        if (!adminSession || adminSession.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const db = getDb();
        const userRes = await db.execute({
            sql: 'SELECT id, username, role, email FROM users WHERE id = ?',
            args: [userId]
        });
        const user = userRes.rows[0] as any;

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Audit Log the impersonation
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await db.execute({
            sql: 'INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
            args: [adminSession.id, 'ADMIN_IMPERSONATION_START', ip, JSON.stringify({ targetUserId: user.id, targetUsername: user.username })]
        });

        // 2. Mock Email Notification
        console.log(`\n--- [EMAIL NOTIFICATION] ---`);
        console.log(`To: ${user.email || 'user@example.com'}`);
        console.log(`Subject: Avviso di Accesso Amministrativo`);
        console.log(`Body: Gentile cliente, un amministratore ha effettuato l'accesso al tuo profilo per fornirti assistenza tecnica.`);
        console.log(`--- [LOGGED TO CONSOLE] ---\n`);

        // 3. Issue the impersonation token
        const impersonationToken = signToken({
            id: Number(user.id),
            username: user.username as string,
            role: user.role as string
        });

        const response = NextResponse.json({ ok: true, redirect: '/catalog' });
        response.cookies.set(COOKIE_NAME, impersonationToken, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 30, // 30 minutes for support session
            path: '/',
        });

        return response;
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
