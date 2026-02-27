import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

function generateOrderNumber() {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `REC-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(Math.random() * 9000) + 1000}`;
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const config = await request.json();
    const db = getDb();
    const orderNumber = generateOrderNumber();

    const totalPrice = (config.basePrice || 0) + (config.materialPriceDelta || 0) +
        (config.heatingCost || 0) + (config.accessoriesTotal || 0);

    const info = db.prepare(
        'INSERT INTO orders (order_number, user_id, config_json, total_price) VALUES (?, ?, ?, ?)'
    ).run(orderNumber, session.id, JSON.stringify(config), totalPrice);

    // Auto-upload CSV to external platform (non-blocking)
    const webhookUrl = process.env.ERP_CSV_WEBHOOK_URL;
    if (webhookUrl) {
        const csvRows = [
            ['Field', 'Value'],
            ['Order Number', orderNumber],
            ['Date', new Date().toISOString()],
            ['Seat Model', config.seatName || ''],
            ['Category', config.category || ''],
            ['Material', config.material || ''],
            ['Color', config.color || ''],
            ['Heating', config.heating ? 'Yes' : 'No'],
            ['Logo - Backrest', config.logos?.schienale ? 'Yes' : 'No'],
            ['Logo - Headrest', config.logos?.poggiatesta ? 'Yes' : 'No'],
            ['Logo - Seat Back', config.logos?.retroSedile ? 'Yes' : 'No'],
            ['Logo - Bolsters', config.logos?.fianchetti ? 'Yes' : 'No'],
            ['Accessories', (config.accessories || []).join(', ')],
            ['Base Price', `€ ${(config.basePrice || 0).toFixed(2)}`],
            ['Total', `€ ${totalPrice.toFixed(2)}`],
        ];
        const csvContent = csvRows.map(row => row.map(v => `"${v}"`).join(',')).join('\n');

        // Fire-and-forget: don't block the customer response
        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/csv',
                'X-Order-Number': orderNumber,
                ...(process.env.ERP_CSV_API_KEY ? { 'Authorization': `Bearer ${process.env.ERP_CSV_API_KEY}` } : {}),
            },
            body: csvContent,
        }).then(res => {
            if (!res.ok) console.error(`[CSV Webhook] Upload failed for ${orderNumber}: HTTP ${res.status}`);
            else console.log(`[CSV Webhook] Successfully uploaded CSV for ${orderNumber}`);
        }).catch(err => {
            console.error(`[CSV Webhook] Error uploading CSV for ${orderNumber}:`, err.message);
        });
    }

    return NextResponse.json({ id: info.lastInsertRowid, orderNumber, totalPrice });
}

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    const db = getDb();
    const orders = db.prepare(`
    SELECT o.*, u.username FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
  `).all();
    return NextResponse.json(orders);
}
