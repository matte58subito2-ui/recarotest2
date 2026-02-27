'use client';
import { useState, useEffect } from 'react';

interface IP { id: number; ip_address: string; label: string; created_at: string; }

export default function IPsPage() {
    const [ips, setIps] = useState<IP[]>([]);
    const [ip, setIp] = useState('');
    const [label, setLabel] = useState('');
    const [error, setError] = useState('');

    const loadIps = () => fetch('/api/admin/ips').then(r => r.json()).then(setIps);
    useEffect(() => { loadIps(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const res = await fetch('/api/admin/ips', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip_address: ip, label })
        });
        if (res.ok) { setIp(''); setLabel(''); loadIps(); }
        else { const data = await res.json(); setError(data.error); }
    };

    const handleRemove = async (id: number) => {
        if (!confirm('Remove IP from whitelist?')) return;
        await fetch('/api/admin/ips', {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        loadIps();
    };

    return (
        <div>
            <h1 style={{ marginBottom: '8px' }}>IP <span style={{ color: 'var(--red)' }}>Whitelist</span></h1>
            <p style={{ color: 'var(--text2)', marginBottom: '32px' }}>Manage the IP addresses authorized to access the B2B platform.</p>

            <div className="card" style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '16px' }}>New Allowed Address</h3>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">IP Address (e.g., 192.168.1.100)</label>
                        <input className="form-input" required value={ip} onChange={e => setIp(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Label / Description</label>
                        <input className="form-input" required value={label} onChange={e => setLabel(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '44px' }}>Add IP</button>
                </form>
                {error && <div style={{ color: 'var(--red-light)', marginTop: '12px', fontSize: '14px' }}>⚠ {error}</div>}
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>IP Address</th>
                        <th>Label</th>
                        <th>Date Added</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {ips.map(i => (
                        <tr key={i.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{i.ip_address}</td>
                            <td>{i.label}</td>
                            <td>{new Date(i.created_at).toLocaleDateString('en-US')}</td>
                            <td style={{ textAlign: 'right' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(i.id)}>Remove</button>
                            </td>
                        </tr>
                    ))}
                    {ips.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px' }}>No IPs configured.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
