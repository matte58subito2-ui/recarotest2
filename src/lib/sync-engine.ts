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

    try {
        for (const item of products) {
            // Generate slug from model_name and category
            const slug = (item.model_name + '-' + item.category)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            const existingRes = await db.execute({
                sql: 'SELECT id FROM seats WHERE slug = ?',
                args: [slug]
            });
            const existing = existingRes.rows[0];

            if (existing) {
                await db.execute({
                    sql: `
                        UPDATE seats 
                        SET model_name = ?, 
                            description = ?, 
                            category = ?, 
                            base_price = ?, 
                            image_url = ?, 
                            active = ?
                        WHERE id = ?
                    `,
                    args: [
                        item.model_name,
                        item.description || '',
                        item.category,
                        item.base_price,
                        item.image_url || '',
                        item.active === false ? 0 : 1,
                        Number(existing.id)
                    ]
                });
                updatedCount++;
            } else {
                await db.execute({
                    sql: `
                        INSERT INTO seats (model_name, slug, description, category, base_price, image_url, active)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    args: [
                        item.model_name,
                        slug,
                        item.description || '',
                        item.category,
                        item.base_price,
                        item.image_url || '',
                        item.active === false ? 0 : 1
                    ]
                });
                createdCount++;
            }
        }

        const logMsg = `Synced ${products.length} products (${createdCount} new, ${updatedCount} updated)`;
        await db.execute({
            sql: 'INSERT INTO sync_logs (source, status, message) VALUES (?, ?, ?)',
            args: [source, 'SUCCESS', logMsg]
        });
        return { success: true, message: logMsg };
    } catch (err: any) {
        await db.execute({
            sql: 'INSERT INTO sync_logs (source, status, message) VALUES (?, ?, ?)',
            args: [source, 'ERROR', err.message]
        });
        throw err;
    }
}
