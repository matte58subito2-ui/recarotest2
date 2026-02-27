import bcrypt from 'bcryptjs';
import getDb from './db';

import fs from 'fs';
import path from 'path';

// Read new scraped categories
const scrapedSeatsPath = path.join(process.cwd(), 'src/lib/new_categories.json');
let SEATS: any[] = [];
if (fs.existsSync(scrapedSeatsPath)) {
    SEATS = JSON.parse(fs.readFileSync(scrapedSeatsPath, 'utf-8'));
}

const MATERIALS = [
    { material: 'Leather', colors: JSON.stringify(['Black', 'Charcoal', 'Fire Red', 'Cognac', 'Sand Beige']), price_delta: 350 },
    { material: 'Alcantara', colors: JSON.stringify(['Black', 'Grey', 'Midnight Blue', 'Military Green', 'Pearl White']), price_delta: 550 },
    { material: 'Fabric', colors: JSON.stringify(['Black', 'Melange Grey', 'Sport Red', 'Racing Blue', 'Neon Orange']), price_delta: 0 },
];

const ACCESSORIES = [
    { name: 'Universal Mounting Bracket', description: 'Stainless steel bracket for mounting on any seat base.', price: 85 },
    { name: 'Adjustable Side Slider', description: 'Allows lateral adjustment of ±50mm for optimal driving position.', price: 120 },
    { name: 'Backrest Sun Protection', description: 'ABS plastic cover protecting the back of the seat from UV rays.', price: 45 },
    { name: 'Low Profile Guide Rails', description: 'Low profile rails to maximize cabin space.', price: 195 },
    { name: 'Lumbar Support Kit', description: 'Memory foam insert for additional lumbar support.', price: 65 },
];

export async function seed() {
    const db = getDb();

    // Admin user
    const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!existingAdmin) {
        const hash = bcrypt.hashSync('recaro2024', 10);
        db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
        console.log('✅ Admin user created: admin / recaro2024');
    }

    // Default IPs
    const ips = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    for (const ip of ips) {
        const existing = db.prepare('SELECT id FROM ip_whitelist WHERE ip_address = ?').get(ip);
        if (!existing) {
            db.prepare('INSERT INTO ip_whitelist (ip_address, label) VALUES (?, ?)').run(ip, 'Localhost');
        }
    }
    console.log('✅ Localhost IPs added to whitelist');

    // Seats
    const existingSeats = db.prepare('SELECT COUNT(*) as c FROM seats').get() as { c: number };
    if (existingSeats.c === 0) {
        const insertSeat = db.prepare('INSERT INTO seats (model_name, slug, description, category, base_price, image_url) VALUES (?, ?, ?, ?, ?, ?)');
        const insertMat = db.prepare('INSERT INTO seat_materials (seat_id, material, colors, price_delta) VALUES (?, ?, ?, ?)');
        const insertAcc = db.prepare('INSERT INTO seat_accessories (seat_id, name, description, price) VALUES (?, ?, ?, ?)');

        const insertAll = db.transaction(() => {
            for (const seat of SEATS) {
                const uniqueSlug = `${seat.slug}-${seat.category.toLowerCase()}`;
                const info = insertSeat.run(seat.model_name, uniqueSlug, seat.description, seat.category, seat.base_price, seat.image_url || null);
                const seatId = info.lastInsertRowid;
                for (const mat of MATERIALS) {
                    insertMat.run(seatId, mat.material, mat.colors, mat.price_delta);
                }
                // 2-3 accessories per seat
                const accs = ACCESSORIES.slice(0, 2 + Math.floor(Math.random() * 2));
                for (const acc of accs) {
                    insertAcc.run(seatId, acc.name, acc.description, acc.price);
                }
            }
        });
        insertAll();
        console.log(`✅ ${SEATS.length} seat models seeded with materials and accessories`);
    }

    console.log('🚀 Database seed complete!');
}

seed().catch(console.error);
