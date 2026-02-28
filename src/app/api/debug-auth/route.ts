import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();
        const db = getDb();

        const qRes = await db.execute({
            sql: 'SELECT * FROM users WHERE username = ? OR email = ?',
            args: [username, username]
        });

        const user = qRes.rows[0] as any;

        if (!user) {
            return NextResponse.json({ debug: "User non trovato nel DB di produzione", query: username });
        }

        const match = bcrypt.compareSync(password, user.password_hash);

        return NextResponse.json({
            debug: "User trovato",
            userId: user.id,
            userRole: user.role,
            isActive: user.is_active,
            providedPassLen: password?.length,
            hashLen: user.password_hash?.length,
            match: match,
            dbUrl: process.env.TURSO_DATABASE_URL?.substring(0, 20) + '...'
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack });
    }
}
