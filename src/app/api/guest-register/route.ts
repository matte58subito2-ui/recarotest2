import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const db = getDb();

        // Basic validation
        if (!data.companyName || !data.vat || !data.address || !data.email || !data.password) {
            return NextResponse.json({ error: 'Tutti i campi sono obbligatori' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(data.email, data.email);
        if (existingUser) {
            return NextResponse.json({ error: 'Utente già registrato con questa email' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        // Insert as pending user
        db.prepare(`
            INSERT INTO users (username, email, password_hash, role, company_name, vat, address, is_active)
            VALUES (?, ?, ?, 'user', ?, ?, ?, 0)
        `).run(data.email, data.email, passwordHash, data.companyName, data.vat, data.address);

        return NextResponse.json({ success: true, message: 'Richiesta di registrazione inviata in attesa di approvazione' });
    } catch (error) {
        console.error('[GUEST_REGISTER_ERROR]', error);
        return NextResponse.json({ error: 'Errore durante la registrazione' }, { status: 500 });
    }
}
