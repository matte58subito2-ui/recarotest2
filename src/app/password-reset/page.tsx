'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './reset.module.css';

function PasswordResetContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Le password non coincidono');
            return;
        }
        if (password.length < 8) {
            setError('La password deve essere di almeno 8 caratteri');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
                setTimeout(() => router.push('/login'), 3000);
            } else {
                setError(data.error);
            }
        } catch {
            setError('Errore di sistema');
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div className={styles.card}>
                <p className={styles.error}>Token di recupero mancante o non valido.</p>
                <button onClick={() => router.push('/login')} className="btn btn-ghost" style={{ width: '100%', marginTop: '16px' }}>Torna al Login</button>
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <Image src="/recaro_logo.png" alt="RECARO Logo" width={180} height={40} style={{ objectFit: 'contain' }} />
            </div>

            <h2 className="text-xl font-bold mb-2">Ripristina Password</h2>
            <p className="text-sm text-gray-500 mb-6">Inserisci una nuova password sicura per il tuo account.</p>

            {success ? (
                <div className={styles.success}>
                    ✓ {success}<br />
                    <small>Verrai reindirizzato al login...</small>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className="form-group">
                        <label className="form-label">Nuova Password</label>
                        <input
                            className="form-input"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="Minimo 8 caratteri"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Conferma Password</label>
                        <input
                            className="form-input"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className={styles.error}>⚠ {error}</div>}
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function PasswordResetPage() {
    return (
        <div className={styles.page}>
            <Suspense fallback={
                <div className={styles.card}>
                    <p style={{ textAlign: 'center', color: '#888' }}>Caricamento modulo di ripristino...</p>
                </div>
            }>
                <PasswordResetContent />
            </Suspense>
        </div>
    );
}
