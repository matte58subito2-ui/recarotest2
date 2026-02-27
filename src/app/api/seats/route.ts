import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    const db = getDb();
    const seats = db.prepare('SELECT * FROM seats WHERE active = 1 ORDER BY category, model_name').all();
    return NextResponse.json(seats);
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { model_name, slug, description, category, base_price } = body;
        const db = getDb();
        const info = db.prepare(
            'INSERT INTO seats (model_name, slug, description, category, base_price) VALUES (?, ?, ?, ?, ?)'
        ).run(model_name, slug, description, category, base_price);
        return NextResponse.json({ id: info.lastInsertRowid });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
