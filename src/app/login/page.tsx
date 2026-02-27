'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [visitorId, setVisitorId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [success, setSuccess] = useState('');
    // Guest State
    const [isGuestMode, setIsGuestMode] = useState(false);
    const [guestForm, setGuestForm] = useState({
        companyName: '',
        vat: '',
        address: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        // Load fingerprint
        const loadFp = async () => {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            setVisitorId(result.visitorId);
            console.log('[DEBUG] Visitor ID:', result.visitorId);
        };
        loadFp();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, visitorId }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Login failed');
                return;
            }

            if (data.mfa_required) {
                setMfaRequired(true);
                return;
            }

            // Success
            router.push('/catalog');
        } catch {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, visitorId, otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Verification failed');
                return;
            }
            // Success
            router.push('/catalog');
        } finally {
            setLoading(false);
        }
    }

    async function handleGuestSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/guest-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(guestForm),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed');
                return;
            }
            // Success
            setSuccess(data.message || 'Richiesta inviata! Verrai contattato via email dopo l\'approvazione.');
            setGuestForm({
                companyName: '',
                vat: '',
                address: '',
                email: '',
                password: ''
            });
        } catch {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.bg} />
            <div className={styles.card}>
                <div style={{ marginBottom: '16px' }}>
                    <Image src="/recaro_logo.png" alt="RECARO Logo" width={220} height={50} style={{ objectFit: 'contain' }} />
                </div>
                <p className={styles.subtitle}>B2B Platform — Restricted Access</p>

                {/* Mode Switcher */}
                {!mfaRequired && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: '#0a0a0a', padding: '6px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
                        <button
                            type="button"
                            onClick={() => { setIsGuestMode(false); setError(''); }}
                            style={{ flex: 1, padding: '10px 0', border: 'none', background: !isGuestMode ? '#222' : 'transparent', color: !isGuestMode ? 'white' : '#888', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                        >
                            Log-in Operatore
                        </button>
                        <button
                            type="button"
                            onClick={() => { setIsGuestMode(true); setError(''); }}
                            style={{ flex: 1, padding: '10px 0', border: 'none', background: isGuestMode ? '#222' : 'transparent', color: isGuestMode ? 'white' : '#888', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                        >
                            Richiesta Registrazione
                        </button>
                    </div>
                )}

                {mfaRequired ? (
                    <form onSubmit={handleVerifyOtp} className={styles.form}>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold mb-2">New Device Detected</h2>
                            <p className="text-sm text-gray-500">For security, please enter the 6-digit code sent to your authorized email.</p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Verification Code</label>
                            <input
                                className="form-input"
                                type="text"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                required
                                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                            />
                        </div>
                        {error && <div className={styles.error}>⚠ {error}</div>}
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Verifying...' : 'Authorize Device'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost mt-4"
                            onClick={() => setMfaRequired(false)}
                            style={{ width: '100%' }}
                        >
                            Back to Login
                        </button>
                    </form>
                ) : isGuestMode ? (
                    <form onSubmit={handleGuestSubmit} className={styles.form}>
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <p style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: 1.5 }}>Invia una richiesta di registrazione per configurare ed ordinare i prodotti.</p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ragione Sociale (Company Name) *</label>
                            <input className="form-input" required type="text" value={guestForm.companyName} onChange={e => setGuestForm({ ...guestForm, companyName: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Partita IVA (VAT) *</label>
                            <input className="form-input" required type="text" value={guestForm.vat} onChange={e => setGuestForm({ ...guestForm, vat: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Indirizzo (Address) *</label>
                            <input className="form-input" required type="text" value={guestForm.address} onChange={e => setGuestForm({ ...guestForm, address: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input className="form-input" required type="email" value={guestForm.email} onChange={e => setGuestForm({ ...guestForm, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Crea Password *</label>
                            <input className="form-input" required type="password" value={guestForm.password} onChange={e => setGuestForm({ ...guestForm, password: e.target.value })} placeholder="••••••••" />
                        </div>
                        {error && <div className={styles.error}>⚠ {error}</div>}
                        {success && <div style={{ color: 'var(--success)', fontSize: '14px', textAlign: 'center', background: 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: '16px' }}>✓ {success}</div>}
                        {!success && (
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                                {loading ? 'Inviando...' : 'Invia Richiesta ↓'}
                            </button>
                        )}
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className="form-group">
                            <label className="form-label">Username / Email</label>
                            <input
                                className="form-input"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="La tua email"
                                autoComplete="username"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-input"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                        </div>
                        {error && <div className={styles.error}>⚠ {error}</div>}
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Logging in...' : 'Access Platform'}
                        </button>
                    </form>
                )}

                <div className={styles.footer}>
                    🔒 Access restricted to authorized operators.<br />
                    Device fingerprinting: <span style={{ opacity: 0.5 }}>{visitorId ? 'Active' : 'Initializing...'}</span>
                </div>
            </div>
        </div>
    );
}
