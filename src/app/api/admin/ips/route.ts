import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET all IPs
export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    const db = getDb();
    const ipsRes = await db.execute('SELECT * FROM ip_whitelist ORDER BY created_at DESC');
    return NextResponse.json(ipsRes.rows);
}

// POST add IP
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    const { ip_address, label } = await request.json();
    const db = getDb();
    try {
        const info = await db.execute({
            sql: 'INSERT INTO ip_whitelist (ip_address, label) VALUES (?, ?)',
            args: [ip_address, label]
        });
        return NextResponse.json({ id: Number(info.lastInsertRowid) });
    } catch (err: any) {
        return NextResponse.json({ error: 'IP già presente' }, { status: 400 });
    }
}

// DELETE remove IP
export async function DELETE(request: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    const { id } = await request.json();
    const db = getDb();
    await db.execute({
        sql: 'DELETE FROM ip_whitelist WHERE id = ?',
        args: [id]
    });
    return NextResponse.json({ ok: true });
}
