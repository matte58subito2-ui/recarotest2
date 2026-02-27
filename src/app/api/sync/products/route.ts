import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { syncProducts } from '@/lib/sync-engine';

export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get('x-api-key');
        const db = getDb();

        const storedKey = db.prepare('SELECT value FROM settings WHERE key = ?').get('SYNC_API_KEY') as any;

        if (!apiKey || apiKey !== storedKey?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { source, products } = body;

        if (!source || !Array.isArray(products)) {
            return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
        }

        const result = await syncProducts(source, products);

        return NextResponse.json(result);
    } catch (err: any) {
        console.error('[SYNC API ERROR]', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
