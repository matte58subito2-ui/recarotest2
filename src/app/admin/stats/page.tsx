'use client';
import { useState, useEffect } from 'react';

interface ProductStat {
    name: string;
    category: string;
    quantity: number;
    revenue: number;
    materials: Record<string, number>;
    colors: Record<string, number>;
}

interface CustomerStat {
    username: string;
    userId: number;
    totalOrders: number;
    totalRevenue: number;
    products: Record<string, { quantity: number; revenue: number }>;
    lastOrder: string;
}

interface CategoryStat {
    name: string;
    count: number;
    revenue: number;
}

interface StatsData {
    summary: {
        totalRevenue: number;
        totalOrders: number;
        avgOrderValue: number;
        totalProducts: number;
        totalCustomers: number;
    };
    topProducts: ProductStat[];
    customers: CustomerStat[];
    categories: CategoryStat[];
}

function fmt(n: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function StatsPage() {
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'customers'>('products');
    const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text2)' }}>Loading statistics...</div>;
    if (!data) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text2)' }}>Unable to load statistics.</div>;

    const maxQty = data.topProducts.length > 0 ? data.topProducts[0].quantity : 1;
    const maxRevenue = data.topProducts.length > 0 ? Math.max(...data.topProducts.map(p => p.revenue)) : 1;

    return (
        <div>
            <h1 style={{ marginBottom: '8px' }}>
                Analytics <span style={{ color: 'var(--red)' }}>Dashboard</span>
            </h1>
            <p style={{ color: 'var(--text2)', marginBottom: '32px' }}>Detailed sales statistics and customer insights.</p>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '36px' }}>
                <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Revenue</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--red-light)' }}>€ {fmt(data.summary.totalRevenue)}</div>
                </div>
                <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Orders</div>
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{data.summary.totalOrders}</div>
                </div>
                <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Avg. Order Value</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e' }}>€ {fmt(data.summary.avgOrderValue)}</div>
                </div>
                <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Active Customers</div>
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{data.summary.totalCustomers}</div>
                </div>
            </div>

            {/* Category Breakdown */}
            {data.categories.length > 0 && (
                <div className="card" style={{ padding: '24px', marginBottom: '36px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--red)', marginBottom: '20px' }}>Revenue by Category</h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {data.categories.map(cat => {
                            const pct = data.summary.totalRevenue > 0 ? (cat.revenue / data.summary.totalRevenue * 100) : 0;
                            return (
                                <div key={cat.name} style={{
                                    flex: '1 1 180px',
                                    background: 'rgba(196, 30, 30, 0.06)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '10px',
                                    padding: '16px 20px',
                                }}>
                                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>{cat.name}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--red-light)' }}>€ {fmt(cat.revenue)}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                                        {cat.count} orders · {pct.toFixed(1)}% of revenue
                                    </div>
                                    <div style={{ marginTop: '8px', height: '4px', background: 'var(--bg2)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--red)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg2)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
                <button
                    className={`btn btn-sm ${activeTab === 'products' ? '' : 'btn-ghost'}`}
                    style={activeTab === 'products' ? { background: 'var(--red)', color: 'white', border: 'none' } : {}}
                    onClick={() => setActiveTab('products')}
                >
                    📊 Top Products
                </button>
                <button
                    className={`btn btn-sm ${activeTab === 'customers' ? '' : 'btn-ghost'}`}
                    style={activeTab === 'customers' ? { background: 'var(--red)', color: 'white', border: 'none' } : {}}
                    onClick={() => setActiveTab('customers')}
                >
                    👥 Customer Analytics
                </button>
            </div>

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>#</th>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Qty Sold</th>
                                <th>Revenue</th>
                                <th style={{ width: '200px' }}>Distribution</th>
                                <th>Top Material</th>
                                <th>Top Color</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topProducts.map((p, i) => {
                                const topMat = Object.entries(p.materials).sort((a, b) => b[1] - a[1])[0];
                                const topCol = Object.entries(p.colors).sort((a, b) => b[1] - a[1])[0];
                                const qtyPct = (p.quantity / maxQty) * 100;
                                return (
                                    <tr key={p.name}>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                background: i === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                                                    i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                                                        i === 2 ? 'linear-gradient(135deg, #cd7f32, #a0522d)' : 'var(--bg2)',
                                                color: i < 3 ? '#fff' : 'var(--text2)',
                                                fontWeight: 800, fontSize: '12px',
                                            }}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>{p.name}</td>
                                        <td><span className="badge badge-red">{p.category}</span></td>
                                        <td style={{ fontWeight: 700 }}>{p.quantity}</td>
                                        <td style={{ color: 'var(--red-light)', fontWeight: 700 }}>€ {fmt(p.revenue)}</td>
                                        <td>
                                            <div style={{ height: '8px', background: 'var(--bg2)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${qtyPct}%`,
                                                    background: 'linear-gradient(90deg, var(--red), var(--red-light))',
                                                    borderRadius: '4px',
                                                    transition: 'width 0.6s ease',
                                                }} />
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text2)' }}>{topMat ? `${topMat[0]} (${topMat[1]})` : '—'}</td>
                                        <td style={{ fontSize: '13px', color: 'var(--text2)' }}>{topCol ? `${topCol[0]} (${topCol[1]})` : '—'}</td>
                                    </tr>
                                );
                            })}
                            {data.topProducts.length === 0 && (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>No sales data yet. Complete some orders to see statistics.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.customers.map(cust => {
                        const isExpanded = expandedCustomer === cust.userId;
                        const productEntries = Object.entries(cust.products).sort((a, b) => b[1].revenue - a[1].revenue);
                        return (
                            <div key={cust.userId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Customer Header Row */}
                                <div
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '20px 24px', cursor: 'pointer',
                                        borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                                        transition: 'background 0.2s',
                                    }}
                                    onClick={() => setExpandedCustomer(isExpanded ? null : cust.userId)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '42px', height: '42px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--red), #a01818)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: '16px', color: 'white',
                                        }}>
                                            {cust.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '15px' }}>{cust.username}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                                                Last order: {new Date(cust.lastOrder).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Orders</div>
                                            <div style={{ fontWeight: 800, fontSize: '18px' }}>{cust.totalOrders}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Products</div>
                                            <div style={{ fontWeight: 800, fontSize: '18px' }}>{productEntries.length}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Revenue</div>
                                            <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--red-light)' }}>€ {fmt(cust.totalRevenue)}</div>
                                        </div>
                                        <div style={{
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s',
                                            fontSize: '14px',
                                            color: 'var(--text3)',
                                        }}>▼</div>
                                    </div>
                                </div>

                                {/* Expanded Products Detail */}
                                {isExpanded && (
                                    <div style={{ padding: '0' }}>
                                        <table className="table" style={{ marginBottom: 0 }}>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th style={{ textAlign: 'center' }}>Quantity</th>
                                                    <th style={{ textAlign: 'right' }}>Revenue</th>
                                                    <th style={{ textAlign: 'right' }}>% of Customer Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {productEntries.map(([name, stats]) => {
                                                    const pct = cust.totalRevenue > 0 ? (stats.revenue / cust.totalRevenue * 100) : 0;
                                                    return (
                                                        <tr key={name}>
                                                            <td style={{ fontWeight: 600 }}>{name}</td>
                                                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{stats.quantity}</td>
                                                            <td style={{ textAlign: 'right', color: 'var(--red-light)', fontWeight: 700 }}>€ {fmt(stats.revenue)}</td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                                    <div style={{ width: '80px', height: '6px', background: 'var(--bg2)', borderRadius: '3px', overflow: 'hidden' }}>
                                                                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--red)', borderRadius: '3px' }} />
                                                                    </div>
                                                                    <span style={{ fontSize: '12px', color: 'var(--text2)', minWidth: '45px' }}>{pct.toFixed(1)}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {data.customers.length === 0 && (
                        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
                            No customer data yet. Complete some orders to see analytics.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
