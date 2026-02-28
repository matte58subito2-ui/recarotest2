import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession();
    const guestCookie = cookies().get('guest_lead');


    const db = getDb();
    const orderRes = await db.execute({
        sql: 'SELECT * FROM orders WHERE id = ?',
        args: [Number(params.id)]
    });
    const order = orderRes.rows[0];
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // SECURITY FIX: IDOR — verify ownership
    if (!session && order.user_id !== null) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session && order.user_id !== null && Number(order.user_id) !== session.id && session.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const config = JSON.parse(order.config_json as string);

    return NextResponse.json({
        id: Number(order.id),
        order_number: order.order_number as string,
        total_price: Number(order.total_price),
        status: order.status as string,
        created_at: order.created_at as string,
        config,
    });
}
