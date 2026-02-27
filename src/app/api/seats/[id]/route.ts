import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const db = getDb();
    const seatRes = await db.execute({
        sql: 'SELECT * FROM seats WHERE id = ? AND active = 1',
        args: [Number(params.id)]
    });
    const seat = seatRes.rows[0];
    if (!seat) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });

    const materialsRes = await db.execute({
        sql: 'SELECT * FROM seat_materials WHERE seat_id = ?',
        args: [Number(seat.id)]
    });
    const accessoriesRes = await db.execute({
        sql: 'SELECT * FROM seat_accessories WHERE seat_id = ?',
        args: [Number(seat.id)]
    });

    return NextResponse.json({
        ...seat,
        materials: materialsRes.rows,
        accessories: accessoriesRes.rows
    });
}
