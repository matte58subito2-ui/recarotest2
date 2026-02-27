import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'recaro-b2b-secret-2024-make-this-secure-in-prod';
const COOKIE_NAME = 'recaro_session';

export interface SessionUser {
    id: number;
    username: string;
    role: string;
}

export function signToken(user: SessionUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): SessionUser | null {
    try {
        return jwt.verify(token, JWT_SECRET) as SessionUser;
    } catch {
        return null;
    }
}

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
}

export { COOKIE_NAME };
