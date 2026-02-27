import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const db = getDb();
    const seat = db.prepare('SELECT * FROM seats WHERE id = ? AND active = 1').get(Number(params.id)) as any;
    if (!seat) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

    const materials = db.prepare('SELECT * FROM seat_materials WHERE seat_id = ?').all(seat.id);
    const accessories = db.prepare('SELECT * FROM seat_accessories WHERE seat_id = ?').all(seat.id);

    return NextResponse.json({ ...seat, materials, accessories });
}
