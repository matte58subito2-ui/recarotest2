import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// SECURITY: JWT_SECRET must be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;

const COOKIE_NAME = 'recaro_session';

import { getDb } from './db';

export interface SessionUser {
    id: number;
    username: string;
    role: string;
    jti?: string;
}

export function signToken(user: SessionUser): string {
    if (!JWT_SECRET) throw new Error('[AUTH] JWT_SECRET is not configured.');
    const jti = Math.random().toString(36).substring(2, 15);
    const iat = Math.floor(Date.now() / 1000);
    return jwt.sign({ ...user, jti, iat }, JWT_SECRET, { expiresIn: '8h' });

}

export async function verifyToken(token: string): Promise<SessionUser | null> {
    try {
        if (!JWT_SECRET) return null;
        const decoded = jwt.verify(token, JWT_SECRET) as unknown as SessionUser & { iat: number };

        if (!decoded.jti) return decoded as SessionUser;

        const db = getDb();

        // 1. Check blacklist
        const revoked = await db.execute({
            sql: 'SELECT 1 FROM revoked_tokens WHERE jti = ?',
            args: [decoded.jti]
        });

        if (revoked.rows.length > 0) return null;

        // 2. Check "Kill All" status for user
        const userRes = await db.execute({
            sql: 'SELECT revoked_all_at FROM users WHERE id = ?',
            args: [decoded.id]
        });
        const user = userRes.rows[0];

        if (user?.revoked_all_at) {
            const revokedAt = new Date(user.revoked_all_at as string).getTime() / 1000;
            if (decoded.iat < revokedAt) {
                return null;
            }
        }

        return decoded as SessionUser;
    } catch {
        return null;
    }
}

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
}

export { COOKIE_NAME };
