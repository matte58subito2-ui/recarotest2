import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const db = getDb();
        const userRes = await db.execute({
            sql: 'SELECT id, username FROM users WHERE email = ? AND is_active = 1',
            args: [email]
        });
        const user = userRes.rows[0];

        // Security best practice: don't reveal if user exists, but here we provide feedback for B2B demo
        if (!user) {
            return NextResponse.json({ message: 'Se l\'email è registrata ed attiva, riceverai un link di ripristino.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

        await db.execute({
            sql: 'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
            args: [Number(user.id), token, expiresAt]
        });

        // Audit log
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await db.execute({
            sql: 'INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)',
            args: [Number(user.id), 'PASSWORD_RESET_REQUESTED', ip, JSON.stringify({ email })]
        });

        // Mock Email
        console.log(`\n--- [EMAIL NOTIFICATION] ---`);
        console.log(`To: ${email}`);
        console.log(`Subject: Ripristino Password RECARO B2B`);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://recaro.vercel.app';
        console.log(`Body: Clicca sul seguente link per resettare la tua password: ${siteUrl}/password-reset?token=${token}`);
        console.log(`--- [LOGGED TO CONSOLE] ---\n`);

        return NextResponse.json({ message: 'Se l\'email è registrata ed attiva, riceverai un link di ripristino.' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
