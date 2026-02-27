import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

function generateOrderNumber() {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `REC-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(Math.random() * 9000) + 1000}`;
}

export async function POST(request: NextRequest) {
    try {
        const config = await request.json();

        // Basic check for guest Lead
        if (!config.guestLead || !config.guestLead.email) {
            return NextResponse.json({ error: 'Dati ospite mancanti' }, { status: 400 });
        }

        const db = getDb();
        const orderNumber = generateOrderNumber();

        const totalPrice = (config.basePrice || 0) + (config.materialPriceDelta || 0) +
            (config.heatingCost || 0) + (config.accessoriesTotal || 0);

        // Guest order: insert user_id = null. We store guest lead details in config_json.
        const info = db.prepare(
            'INSERT INTO orders (order_number, user_id, config_json, total_price) VALUES (?, ?, ?, ?)'
        ).run(orderNumber, null, JSON.stringify(config), totalPrice);

        // Auto-upload CSV to external platform (non-blocking) just like normal orders
        const webhookUrl = process.env.ERP_CSV_WEBHOOK_URL;
        if (webhookUrl) {
            const csvRows = [
                ['Field', 'Value'],
                ['Order Number', orderNumber],
                ['Date', new Date().toISOString()],
                ['Order Type', 'Guest (Stadium Configurator)'],
                ['Guest Company', config.guestLead.companyName || ''],
                ['Guest VAT', config.guestLead.vat || ''],
                ['Guest Email', config.guestLead.email || ''],
                ['Guest Address', config.guestLead.address || ''],
                ['Seat Model', config.seatName || ''],
                ['Category', config.category || ''],
                ['Color', config.color || ''],
                ['Base Price', `€ ${(config.basePrice || 0).toFixed(2)}`],
                ['Total', `€ ${totalPrice.toFixed(2)}`],
            ];
            const csvContent = csvRows.map(row => row.map(v => `"${v}"`).join(',')).join('\n');

            fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/csv',
                    'X-Order-Number': orderNumber,
                    ...(process.env.ERP_CSV_API_KEY ? { 'Authorization': `Bearer ${process.env.ERP_CSV_API_KEY}` } : {}),
                },
                body: csvContent,
            }).catch(() => { });
        }

        return NextResponse.json({ id: info.lastInsertRowid, orderNumber, totalPrice });
    } catch (err: any) {
        console.error('Guest Order Error:', err);
        return NextResponse.json({ error: 'Failed to create guest order' }, { status: 500 });
    }
}
