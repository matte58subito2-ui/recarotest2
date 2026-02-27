import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

interface OrderRow {
    id: number;
    order_number: string;
    user_id: number;
    config_json: string;
    total_price: number;
    status: string;
    created_at: string;
    username: string;
}

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDb();

    const ordersRes = await db.execute(`
        SELECT o.*, u.username FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC
    `);
    const orders = ordersRes.rows as unknown as OrderRow[];

    // --- Product Statistics ---
    const productMap = new Map<string, {
        name: string;
        category: string;
        quantity: number;
        revenue: number;
        materials: Record<string, number>;
        colors: Record<string, number>;
    }>();

    // --- Customer Statistics ---
    const customerMap = new Map<string, {
        username: string;
        userId: number;
        totalOrders: number;
        totalRevenue: number;
        products: Record<string, { quantity: number; revenue: number }>;
        lastOrder: string;
    }>();

    for (const order of orders) {
        let config: any;
        try {
            config = JSON.parse(order.config_json as string);
        } catch {
            continue;
        }

        const seatName = config.seatName || 'Unknown';
        const category = config.category || 'Uncategorized';
        const material = config.material || 'Unknown';
        const color = config.color || 'Unknown';
        const username = order.username || 'Unknown';

        // Product stats
        if (!productMap.has(seatName)) {
            productMap.set(seatName, {
                name: seatName,
                category,
                quantity: 0,
                revenue: 0,
                materials: {},
                colors: {},
            });
        }
        const prod = productMap.get(seatName)!;
        prod.quantity += 1;
        prod.revenue += order.total_price || 0;
        prod.materials[material] = (prod.materials[material] || 0) + 1;
        prod.colors[color] = (prod.colors[color] || 0) + 1;

        // Customer stats
        const custKey = `${order.user_id}`;
        if (!customerMap.has(custKey)) {
            customerMap.set(custKey, {
                username,
                userId: order.user_id,
                totalOrders: 0,
                totalRevenue: 0,
                products: {},
                lastOrder: order.created_at,
            });
        }
        const cust = customerMap.get(custKey)!;
        cust.totalOrders += 1;
        cust.totalRevenue += order.total_price || 0;
        if (order.created_at > cust.lastOrder) cust.lastOrder = order.created_at;

        if (!cust.products[seatName]) {
            cust.products[seatName] = { quantity: 0, revenue: 0 };
        }
        cust.products[seatName].quantity += 1;
        cust.products[seatName].revenue += order.total_price || 0;
    }

    // Sort products by quantity sold (descending)
    const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity);

    // Sort customers by revenue (descending)
    const customers = Array.from(customerMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Summary KPIs
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Category breakdown
    const categoryMap = new Map<string, { count: number; revenue: number }>();
    for (const prod of topProducts) {
        if (!categoryMap.has(prod.category)) {
            categoryMap.set(prod.category, { count: 0, revenue: 0 });
        }
        const cat = categoryMap.get(prod.category)!;
        cat.count += prod.quantity;
        cat.revenue += prod.revenue;
    }
    const categories = Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
        summary: { totalRevenue, totalOrders, avgOrderValue, totalProducts: topProducts.length, totalCustomers: customers.length },
        topProducts,
        customers,
        categories,
    });
}
