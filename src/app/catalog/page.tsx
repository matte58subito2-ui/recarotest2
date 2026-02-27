import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import getDb from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

const BRANCHES = [
    { name: 'Motorsport', icon: '🏁', desc: 'Born for the track.' },
    { name: 'Stadium', icon: '🏟️', desc: 'VIP venue excellence.' },
    { name: 'Comfort', icon: '🧘', desc: 'Ergonomics for life.' },
    { name: 'Nautic', icon: '⚓', desc: 'Master the elements.' }
];

const CATEGORY_COLORS: Record<string, string> = {
    Motorsport: '#c41e1e',
    Stadium: '#e85d04',
    Comfort: '#9b59b6',
    Nautic: '#2980b9',
};

export default async function CatalogPage({ searchParams }: { searchParams: { cat?: string } }) {
    const session = await getSession();
    const guestLeadCookie = cookies().get('guest_lead')?.value;

    if (!session && !guestLeadCookie) redirect('/login');

    const db = getDb();
    const selectedCat = searchParams.cat || '';

    let sql = 'SELECT * FROM seats WHERE active = 1';
    const args: any[] = [];
    if (selectedCat) {
        sql += ' AND category = ?';
        args.push(selectedCat);
    }
    sql += ' ORDER BY category, model_name';

    const seatsRes = await db.execute({ sql, args });
    const seats = seatsRes.rows as any[];

    return (
        <>
            <Navbar role={session?.role || 'guest'} />
            <main className="container page">
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
                        Product <span style={{ color: 'var(--red-light)' }}>Categories</span>
                    </h1>
                    <p style={{ color: 'var(--text2)', fontSize: '15px' }}>
                        Select a specialized branch to explore our seating solutions.
                    </p>
                </div>

                {/* Branch Selection Grid */}
                <div className="grid-4" style={{ marginBottom: '60px', gap: '20px' }}>
                    {BRANCHES.map(branch => (
                        <Link
                            key={branch.name}
                            href={`/catalog?cat=${branch.name}`}
                            className={`card branch-card ${selectedCat === branch.name ? 'active' : ''}`}
                            style={{
                                padding: '32px 24px',
                                textAlign: 'center',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: selectedCat === branch.name ? '2px solid var(--red)' : '1px solid var(--border)',
                                background: selectedCat === branch.name ? 'rgba(196, 30, 30, 0.05)' : 'var(--bg2)',
                                scale: selectedCat === branch.name ? '1.02' : '1',
                                opacity: selectedCat && selectedCat !== branch.name ? 0.4 : 1,
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                boxShadow: selectedCat === branch.name ? 'var(--shadow-red)' : 'none'
                            }}
                        >
                            <div style={{
                                fontSize: '48px',
                                marginBottom: '20px',
                                filter: selectedCat === branch.name ? 'drop-shadow(0 0 12px rgba(196, 30, 30, 0.5))' : 'none',
                                transition: 'all 0.3s ease'
                            }}>
                                {branch.icon}
                            </div>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '800',
                                marginBottom: '10px',
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                color: selectedCat === branch.name ? 'white' : 'var(--text)'
                            }}>
                                {branch.name}
                            </h3>
                            <p style={{
                                fontSize: '12px',
                                color: selectedCat === branch.name ? 'var(--text2)' : 'var(--text3)',
                                lineHeight: '1.4',
                                maxWidth: '160px'
                            }}>
                                {branch.desc}
                            </p>
                        </Link>
                    ))}
                </div>

                {selectedCat ? (
                    <div className="animate-fade">
                        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
                                {selectedCat.toUpperCase()}
                                <span style={{ color: 'var(--text3)', fontWeight: '400', fontSize: '16px', marginLeft: '12px' }}>
                                    — {seats.length} models
                                </span>
                            </h2>
                            <Link href="/catalog" className="btn btn-ghost btn-sm">
                                Reset Selection
                            </Link>
                        </div>

                        {seats.length === 0 ? (
                            <div className="empty-state card" style={{ padding: '80px 20px', background: 'transparent' }}>
                                <div className="empty-icon" style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.5 }}>🪑</div>
                                <h3 className="empty-title">No models found</h3>
                                <p className="empty-desc">No seats available in the {selectedCat} category.</p>
                            </div>
                        ) : (
                            <div className="grid-3">
                                {seats.map((seat, idx) => (
                                    <Link
                                        key={seat.id}
                                        href={`/catalog/${seat.id}`}
                                        className="seat-card"
                                        style={{ animationDelay: `${idx * 40}ms` }}
                                    >
                                        <div style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: '240px',
                                            background: 'linear-gradient(135deg, #111, #1a1a1a)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '20px'
                                        }}>
                                            {seat.image_url ? (
                                                <Image
                                                    src={seat.image_url}
                                                    alt={seat.model_name}
                                                    width={280}
                                                    height={220}
                                                    style={{ objectFit: 'contain', transition: 'transform 0.5s ease' }}
                                                    className="seat-image"
                                                />
                                            ) : (
                                                <div style={{ fontSize: '80px', opacity: 0.2 }}>🪑</div>
                                            )}
                                        </div>
                                        <div className="seat-card-body">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div className="seat-card-category" style={{
                                                    color: CATEGORY_COLORS[seat.category] || 'var(--red-light)',
                                                    fontSize: '10px',
                                                    padding: '2px 8px',
                                                    background: `${CATEGORY_COLORS[seat.category] || 'var(--red)'}15`,
                                                    borderRadius: '4px'
                                                }}>
                                                    {seat.category}
                                                </div>
                                            </div>
                                            <h4 className="seat-card-name" style={{ fontSize: '18px', marginBottom: '8px' }}>{seat.model_name}</h4>
                                            <p className="seat-card-desc" style={{ fontSize: '12px', minHeight: '40px' }}>{seat.description}</p>
                                            <div className="divider" style={{ margin: '16px 0', opacity: 0.5 }}></div>
                                            <div className="seat-card-footer">
                                                <div>
                                                    <div className="seat-card-price-label">Base price</div>
                                                    <div className="seat-card-price" style={{ fontSize: '20px' }}>€ {seat.base_price.toLocaleString('en-US')}</div>
                                                </div>
                                                <div className="btn btn-primary btn-sm" style={{ borderRadius: '20px', padding: '6px 16px' }}>
                                                    Configure
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '120px 0',
                        opacity: 0.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '24px',
                        background: 'radial-gradient(circle at center, #111 0%, transparent 70%)',
                        borderRadius: '40px'
                    }}>
                        <div style={{
                            fontSize: '80px',
                            filter: 'grayscale(1)',
                            animation: 'pulse 3s infinite ease-in-out'
                        }}>
                            📦
                        </div>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
                                Browse the Catalog
                            </h3>
                            <p style={{ maxWidth: '300px', margin: '0 auto', fontSize: '14px' }}>
                                Select one of the RECARO divisions above to view available models.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
