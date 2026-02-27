import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(params.id)) as any;
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const config = JSON.parse(order.config_json);

    // Generate CSV
    const csvRows = [
        ['Field', 'Value'],
        ['Order Number', order.order_number],
        ['Date', order.created_at],
        ['Seat Model', config.seatName || ''],
        ['Material', config.material || ''],
        ['Color', config.color || ''],
        ['Heating', config.heating ? 'Yes' : 'No'],
        ['Logo - Backrest', config.logos?.schienale ? 'Yes' : 'No'],
        ['Logo - Headrest', config.logos?.poggiatesta ? 'Yes' : 'No'],
        ['Logo - Seat Back', config.logos?.retroSedile ? 'Yes' : 'No'],
        ['Logo - Bolsters', config.logos?.fianchetti ? 'Yes' : 'No'],
        ['Accessories', (config.accessories || []).join(', ')],
        ['Base Price', `€ ${config.basePrice?.toFixed(2) || '0.00'}`],
        ['Total', `€ ${order.total_price?.toFixed(2) || '0.00'}`],
        ['Status', order.status],
    ];

    const csv = csvRows.map(row => row.map(v => `"${v}"`).join(',')).join('\n');

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="order-${order.order_number}.csv"`,
        },
    });
}
