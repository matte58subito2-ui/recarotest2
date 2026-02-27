import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    try {
        const text = await request.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        const db = getDb();
        let count = 0;

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length < 3) continue;
            const row: any = {};
            headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

            const slug = (row.model_name || row.nome || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            if (!slug) continue;

            await db.execute({
                sql: 'INSERT OR REPLACE INTO seats (model_name, slug, description, category, base_price) VALUES (?, ?, ?, ?, ?)',
                args: [
                    row.model_name || row.nome || `Modello ${i}`,
                    slug,
                    row.description || row.descrizione || '',
                    row.category || row.categoria || 'Generale',
                    parseFloat(row.base_price || row.prezzo || '0') || 0
                ]
            });
            count++;
        }

        return NextResponse.json({ ok: true, imported: count });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
