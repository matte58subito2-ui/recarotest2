'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Order {
    id: number;
    order_number: string;
    username: string;
    total_price: number;
    status: string;
    created_at: string;
    config_json: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const newOrderId = searchParams.get('new');

    useEffect(() => {
        fetch('/api/orders').then(r => r.json()).then(data => {
            setOrders(Array.isArray(data) ? data : []);
            setLoading(false);
        });
    }, []);

    return (
        <div>
            <h1 style={{ marginBottom: '8px' }}>Manage <span style={{ color: 'var(--red)' }}>Orders</span></h1>
            <p style={{ color: 'var(--text2)', marginBottom: '32px' }}>View and export generated quotes and orders.</p>

            {newOrderId && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '16px 24px', borderRadius: '8px', marginBottom: '32px', color: 'var(--success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><strong>✅ Order Completed successfully!</strong><br /><span style={{ fontSize: '13px', color: 'var(--text2)' }}>The configuration has been saved to the system.</span></div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={`/api/orders/${newOrderId}/pdf`} target="_blank" className="btn" style={{ background: 'var(--success)', color: 'white', border: 'none' }}>📄 Download Document (PDF/Print)</a>
                        <a href={`/api/orders/${newOrderId}/csv`} className="btn btn-secondary">📊 Export for ERP</a>
                    </div>
                </div>
            )}

            {loading ? (
                <div>Loading...</div>
            ) : (
                <table className="table card" style={{ padding: 0, overflow: 'hidden' }}>
                    <thead>
                        <tr>
                            <th>Order Number</th>
                            <th>Date</th>
                            <th>Operator</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Documents</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id}>
                                <td style={{ fontWeight: 'bold' }}>{o.order_number}</td>
                                <td>{new Date(o.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                <td>
                                    {o.username ? o.username : (
                                        <span className="badge badge-gray">
                                            {(() => {
                                                try {
                                                    const c = JSON.parse(o.config_json);
                                                    return c.guestLead ? `${c.guestLead.companyName} (Guest)` : 'Guest';
                                                } catch {
                                                    return 'Guest';
                                                }
                                            })()}
                                        </span>
                                    )}
                                </td>
                                <td style={{ color: 'var(--red-light)', fontWeight: 'bold' }}>€ {o.total_price.toFixed(2)}</td>
                                <td><span className="badge badge-gray">{o.status}</span></td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <a href={`/api/orders/${o.id}/pdf`} target="_blank" className="btn btn-ghost btn-sm" title="Print Document">📄 PDF</a>
                                        <a href={`/api/orders/${o.id}/csv`} className="btn btn-ghost btn-sm" title="Export CSV">📊 CSV</a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>No orders found in the system.</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}
