import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const db = getDb();

        // Strict Input Validation
        if (!data.companyName || !data.vat || !data.address || !data.email || !data.password) {
            return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return NextResponse.json({ error: 'Formato email non valido' }, { status: 400 });
        }

        if (data.password.length < 8) {
            return NextResponse.json({ error: 'La password deve avere almeno 8 caratteri' }, { status: 400 });
        }

        if (data.vat.length > 30 || data.companyName.length > 200 || data.address.length > 500) {
            return NextResponse.json({ error: 'I campi superano la lunghezza massima consentita' }, { status: 400 });
        }


        // Check if user already exists
        const existingUserRes = await db.execute({
            sql: 'SELECT id FROM users WHERE email = ? OR username = ?',
            args: [data.email, data.email]
        });
        if (existingUserRes.rows.length > 0) {
            return NextResponse.json({ error: 'Utente già registrato con questa email' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        // Insert as pending user
        await db.execute({
            sql: `
                INSERT INTO users (username, email, password_hash, role, company_name, vat, address, is_active)
                VALUES (?, ?, ?, 'user', ?, ?, ?, 0)
            `,
            args: [data.email, data.email, passwordHash, data.companyName, data.vat, data.address]
        });

        return NextResponse.json({ success: true, message: 'Richiesta di registrazione inviata in attesa di approvazione' });
    } catch (error) {
        console.error('[GUEST_REGISTER_ERROR]', error);
        return NextResponse.json({ error: 'Errore durante la registrazione' }, { status: 500 });
    }
}
