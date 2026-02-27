'use client';
import { useState, useEffect } from 'react';

export default function AdminRequestsPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function toggleApproval(userId: number, currentStatus: number) {
        try {
            const res = await fetch('/api/admin/users/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, active: currentStatus === 0 }),
            });
            if (res.ok) {
                setMessage('Stato utente aggiornato con successo');
                fetchUsers();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function impersonateUser(userId: number) {
        if (!confirm('Vuoi effettuare l\'accesso come questo utente? Verrai reindirizzato al catalogo.')) return;
        try {
            const res = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = data.redirect;
            } else {
                alert(data.error || 'Errore durante l\'impersonificazione');
            }
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) return <div className="page">Caricamento richieste...</div>;

    const pendingUsers = users.filter((u: any) => u.is_active === 0);
    const approvedUsers = users.filter((u: any) => u.is_active === 1);

    return (
        <div className="page">
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Gestione Utenti & Sicurezza</h1>
                <p style={{ color: 'var(--text2)' }}>Approva nuove registrazioni, gestisci operatori attivi o intervieni per assistenza.</p>
            </div>

            {message && (
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '24px' }}>
                    ✓ {message}
                </div>
            )}

            <div className="card" style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--warning)' }}>●</span> In Attesa di Approvazione ({pendingUsers.length})
                </h2>

                {pendingUsers.length === 0 ? (
                    <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>Nessuna richiesta in attesa.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Azienda</th>
                                <th>Email / Username</th>
                                <th>Dettagli</th>
                                <th>Azione</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{user.company_name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>P.IVA: {user.vat}</div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td style={{ fontSize: '12px', maxWidth: '200px' }}>{user.address}</td>
                                    <td>
                                        <button
                                            onClick={() => toggleApproval(user.id, user.is_active)}
                                            className="btn btn-primary btn-sm"
                                        >
                                            Approva Accesso
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="card">
                <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--success)' }}>●</span> Operatori Attivi ({approvedUsers.length})
                </h2>

                {approvedUsers.length === 0 ? (
                    <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>Nessun operatore attivo.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Azienda</th>
                                <th>Email</th>
                                <th>Stato</th>
                                <th>Azione</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.company_name}</td>
                                    <td>{user.email}</td>
                                    <td><span className="badge badge-green">Attivo</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => impersonateUser(user.id)}
                                                className="btn btn-primary btn-sm"
                                                title="Assistenza: entra come questo utente"
                                            >
                                                Assisti
                                            </button>
                                            <button
                                                onClick={() => toggleApproval(user.id, user.is_active)}
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: 'var(--red-light)' }}
                                            >
                                                Sospendi
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
