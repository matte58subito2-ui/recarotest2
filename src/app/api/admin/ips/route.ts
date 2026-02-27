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
    const ips = db.prepare('SELECT * FROM ip_whitelist ORDER BY created_at DESC').all();
    return NextResponse.json(ips);
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
        const info = db.prepare('INSERT INTO ip_whitelist (ip_address, label) VALUES (?, ?)').run(ip_address, label);
        return NextResponse.json({ id: info.lastInsertRowid });
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
    db.prepare('DELETE FROM ip_whitelist WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
}
