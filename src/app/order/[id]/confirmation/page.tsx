'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface OrderData {
    id: number;
    order_number: string;
    total_price: number;
    status: string;
    created_at: string;
    config: {
        seatName?: string;
        category?: string;
        material?: string;
        color?: string;
        heating?: boolean;
        heatingCost?: number;
        logos?: Record<string, boolean>;
        accessories?: string[];
        basePrice?: number;
        materialPriceDelta?: number;
        accessoriesTotal?: number;
        guestLead?: { companyName: string; vat: string; address: string; email: string; };
    };
}

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`/api/orders/${params.id}`)
            .then(r => {
                if (!r.ok) throw new Error('Order not found');
                return r.json();
            })
            .then(data => {
                setOrder(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Order not found');
                setLoading(false);
            });
    }, [params.id]);

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="container page" style={{ textAlign: 'center', marginTop: '120px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                    <div style={{ color: 'var(--text2)' }}>Loading order confirmation...</div>
                </main>
            </>
        );
    }

    if (error || !order) {
        return (
            <>
                <Navbar />
                <main className="container page" style={{ textAlign: 'center', marginTop: '120px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                    <h2>Order Not Found</h2>
                    <p style={{ color: 'var(--text2)', marginTop: '12px' }}>The requested order could not be found.</p>
                    <Link href="/catalog" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-block' }}>← Back to Catalogue</Link>
                </main>
            </>
        );
    }

    const config = order.config;
    const activeLogos = config.logos ? Object.entries(config.logos).filter(([_, v]) => v).map(([k]) => {
        const labelMap: Record<string, string> = { schienale: 'Backrest', poggiatesta: 'Headrest', retroSedile: 'Seat Back', fianchetti: 'Bolsters' };
        return labelMap[k] || k;
    }) : [];

    return (
        <>
            <Navbar />
            <main className="container page">
                <div style={{ maxWidth: '720px', margin: '0 auto', paddingTop: '40px' }}>
                    {/* Success Header */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '48px',
                        animation: 'fadeIn 0.6s ease-out',
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px', fontSize: '36px',
                            boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)',
                        }}>
                            ✓
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>
                            Order <span style={{ color: 'var(--red-light)' }}>Confirmed</span>
                        </h1>
                        <p style={{ color: 'var(--text2)', fontSize: '15px' }}>
                            Your configuration has been successfully submitted.
                        </p>
                    </div>

                    {/* Order Number Badge */}
                    <div style={{
                        background: 'rgba(196, 30, 30, 0.08)',
                        border: '1px solid rgba(196, 30, 30, 0.25)',
                        borderRadius: '12px',
                        padding: '20px 28px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '32px',
                    }}>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Order Number</div>
                            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '1px', color: 'var(--red-light)' }}>{order.order_number}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Date</div>
                            <div style={{ fontSize: '15px', fontWeight: 600 }}>
                                {new Date(order.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {config.guestLead && (
                        <div className="card" style={{ padding: '28px', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--red)', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                Guest Information
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Company Name</div>
                                    <div style={{ fontWeight: 600 }}>{config.guestLead.companyName || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>VAT</div>
                                    <div style={{ fontWeight: 600 }}>{config.guestLead.vat || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Address</div>
                                    <div style={{ fontWeight: 600 }}>{config.guestLead.address || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Email</div>
                                    <div style={{ fontWeight: 600 }}>{config.guestLead.email || '—'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Configuration Summary Card */}
                    <div className="card" style={{ padding: '28px', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--red)', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                            Configuration Summary
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Model</div>
                                <div style={{ fontWeight: 600 }}>{config.seatName || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Category</div>
                                <div style={{ fontWeight: 600 }}>{config.category || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Material</div>
                                <div style={{ fontWeight: 600 }}>{config.material || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Color</div>
                                <div style={{ fontWeight: 600 }}>{config.color || '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Heating</div>
                                <div style={{ fontWeight: 600 }}>{config.heating ? '✅ 3-Zone Heating' : '—'}</div>
                            </div>
                            {activeLogos.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Logo Positions</div>
                                    <div style={{ fontWeight: 600 }}>{activeLogos.join(', ')}</div>
                                </div>
                            )}
                        </div>

                        {config.accessories && config.accessories.length > 0 && (
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' }}>Accessories</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {config.accessories.map((a, i) => (
                                        <span key={i} className="badge badge-gray">{a}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price Summary */}
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px solid var(--red)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Total</span>
                                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--red-light)' }}>€ {order.total_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Download PDF Button */}
                    <a
                        href={`/api/orders/${order.id}/pdf`}
                        target="_blank"
                        className="btn"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '18px 32px',
                            fontSize: '16px',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #c41e1e, #a01818)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            marginBottom: '16px',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 4px 20px rgba(196, 30, 30, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 30px rgba(196, 30, 30, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(196, 30, 30, 0.3)';
                        }}
                    >
                        📄 Download Order Confirmation (PDF)
                    </a>

                    {/* Back to Catalogue */}
                    <div style={{ textAlign: 'center', marginTop: '24px', paddingBottom: '40px' }}>
                        <Link href="/catalog" className="btn btn-ghost" style={{ fontSize: '14px' }}>
                            ← Back to Catalogue
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
