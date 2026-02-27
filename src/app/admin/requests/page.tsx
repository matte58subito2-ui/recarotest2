'use client';
import { useState, useEffect } from 'react';

interface User {
    id: number;
    username: string;
    email: string;
    company_name: string;
    vat: string;
    address: string;
    is_active: number;
    created_at: string;
}

export default function AdminRequestsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');
    const [processing, setProcessing] = useState<number | null>(null);

    useEffect(() => { fetchUsers(); }, []);

    async function fetchUsers() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (res.ok) setUsers(data.users || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    }

    async function approve(userId: number) {
        setProcessing(userId);
        try {
            const res = await fetch('/api/admin/users/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, active: true }),
            });
            if (res.ok) {
                showToast('✅ Accesso approvato con successo');
                await fetchUsers();
            } else {
                const data = await res.json();
                showToast(`❌ Errore: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(null);
        }
    }

    async function reject(userId: number) {
        if (!confirm('Sei sicuro di voler rifiutare/sospendere questo account?')) return;
        setProcessing(userId);
        try {
            const res = await fetch('/api/admin/users/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, active: false }),
            });
            if (res.ok) {
                showToast('Account sospeso');
                await fetchUsers();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(null);
        }
    }

    async function impersonate(userId: number) {
        if (!confirm('Vuoi accedere come questo operatore per assistenza?')) return;
        try {
            const res = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (res.ok) window.location.href = data.redirect;
            else alert(data.error || 'Errore durante impersonificazione');
        } catch (err) {
            console.error(err);
        }
    }

    const pendingUsers = users.filter(u => u.is_active === 0);
    const activeUsers = users.filter(u => u.is_active === 1);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text2)', padding: '40px 0' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid var(--recaro-red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Caricamento richieste...
        </div>
    );

    return (
        <div>
            {/* Toast notification */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 1000,
                    background: '#1a1a1a', color: 'white', padding: '14px 20px',
                    borderRadius: '12px', border: '1px solid #333', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.3s ease', fontSize: '14px', fontWeight: 500
                }}>
                    {toast}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 className="text-3xl font-bold">Richieste di Accesso</h1>
                    <p style={{ color: 'var(--text2)', marginTop: '6px' }}>
                        Approva o rifiuta le registrazioni degli operatori B2B.
                    </p>
                </div>
                <button onClick={fetchUsers} className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
                    🔄 Aggiorna
                </button>
            </div>

            {/* Pending Section */}
            <div className="card" style={{ marginBottom: '32px', borderColor: pendingUsers.length > 0 ? 'rgba(251, 191, 36, 0.3)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: pendingUsers.length > 0 ? '#f59e0b' : '#555', boxShadow: pendingUsers.length > 0 ? '0 0 8px #f59e0b' : 'none', flexShrink: 0 }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                        In Attesa di Approvazione
                        {pendingUsers.length > 0 && (
                            <span style={{ marginLeft: '10px', background: 'rgba(251,191,36,0.15)', color: '#f59e0b', fontSize: '12px', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(251,191,36,0.3)' }}>
                                {pendingUsers.length}
                            </span>
                        )}
                    </h2>
                </div>

                {pendingUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
                        <div style={{ fontWeight: 600 }}>Nessuna richiesta in attesa</div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>Tutte le richieste sono state gestite.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {pendingUsers.map(user => (
                            <div key={user.id} style={{
                                display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
                                gap: '16px', padding: '20px', background: 'rgba(251,191,36,0.04)',
                                border: '1px solid rgba(251,191,36,0.15)', borderRadius: '12px'
                            }}>
                                <div style={{ flex: 1, minWidth: '220px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
                                        {user.company_name || user.username || user.email}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '2px' }}>
                                        📧 {user.email}
                                    </div>
                                    {user.vat && <div style={{ fontSize: '12px', color: 'var(--text3)' }}>P.IVA: {user.vat}</div>}
                                    {user.address && <div style={{ fontSize: '12px', color: 'var(--text3)' }}>📍 {user.address}</div>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                        Registrato il {new Date(user.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => reject(user.id)}
                                            disabled={processing === user.id}
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: '#888' }}
                                        >
                                            Rifiuta
                                        </button>
                                        <button
                                            onClick={() => approve(user.id)}
                                            disabled={processing === user.id}
                                            className="btn btn-primary btn-sm"
                                            style={{ background: '#16a34a', borderColor: '#16a34a', minWidth: '130px' }}
                                        >
                                            {processing === user.id ? '...' : '✓ Approva Accesso'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Operators Section */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', flexShrink: 0 }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                        Operatori Attivi
                        <span style={{ marginLeft: '10px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '12px', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.3)' }}>
                            {activeUsers.length}
                        </span>
                    </h2>
                </div>

                {activeUsers.length === 0 ? (
                    <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>Nessun operatore attivo ancora.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Azienda / Username</th>
                                <th>Email</th>
                                <th>P.IVA</th>
                                <th>Registrato</th>
                                <th style={{ textAlign: 'right' }}>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeUsers.map(user => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: 600 }}>{user.company_name || user.username || '—'}</td>
                                    <td style={{ color: 'var(--text2)' }}>{user.email}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text3)' }}>{user.vat || '—'}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text3)' }}>
                                        {new Date(user.created_at).toLocaleDateString('it-IT')}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => impersonate(user.id)}
                                                className="btn btn-primary btn-sm"
                                                title="Accedi come questo operatore per assistenza"
                                            >
                                                Assisti
                                            </button>
                                            <button
                                                onClick={() => reject(user.id)}
                                                disabled={processing === user.id}
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: 'var(--red-light)' }}
                                            >
                                                {processing === user.id ? '...' : 'Sospendi'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
