import getDb from './db';

export interface ERPSyncData {
    id_external?: string;
    model_name: string;
    category: string;
    description?: string;
    base_price: number;
    image_url?: string;
    active?: boolean;
}

export async function syncProducts(source: string, products: ERPSyncData[]) {
    const db = getDb();
    let updatedCount = 0;
    let createdCount = 0;

    const upsert = db.transaction((dataList: ERPSyncData[]) => {
        for (const item of dataList) {
            // Generate slug from model_name and category
            const slug = (item.model_name + '-' + item.category)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            const existing = db.prepare('SELECT id FROM seats WHERE slug = ?').get(slug) as any;

            if (existing) {
                db.prepare(`
                    UPDATE seats 
                    SET model_name = ?, 
                        description = ?, 
                        category = ?, 
                        base_price = ?, 
                        image_url = ?, 
                        active = ?
                    WHERE id = ?
                `).run(
                    item.model_name,
                    item.description || '',
                    item.category,
                    item.base_price,
                    item.image_url || '',
                    item.active === false ? 0 : 1,
                    existing.id
                );
                updatedCount++;
            } else {
                db.prepare(`
                    INSERT INTO seats (model_name, slug, description, category, base_price, image_url, active)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    item.model_name,
                    slug,
                    item.description || '',
                    item.category,
                    item.base_price,
                    item.image_url || '',
                    item.active === false ? 0 : 1
                );
                createdCount++;
            }
        }
    });

    try {
        upsert(products);
        const logMsg = `Synced ${products.length} products (${createdCount} new, ${updatedCount} updated)`;
        db.prepare('INSERT INTO sync_logs (source, status, message) VALUES (?, ?, ?)')
            .run(source, 'SUCCESS', logMsg);
        return { success: true, message: logMsg };
    } catch (err: any) {
        db.prepare('INSERT INTO sync_logs (source, status, message) VALUES (?, ?, ?)')
            .run(source, 'ERROR', err.message);
        throw err;
    }
}
