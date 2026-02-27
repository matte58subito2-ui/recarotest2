import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const users = db.prepare(`
            SELECT id, email, company_name, vat, address, is_active, created_at 
            FROM users 
            WHERE role = 'user' 
            ORDER BY created_at DESC
        `).all();

        return NextResponse.json({ users });
    } catch (error) {
        console.error('[ADMIN_USERS_GET]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
