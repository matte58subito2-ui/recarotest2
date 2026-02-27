import getDb from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function SyncPage() {
    headers(); // Force dynamic
    const db = getDb();
    const logsRes = await db.execute('SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 50');
    const logs = logsRes.rows;

    const apiKeySettingRes = await db.execute({
        sql: 'SELECT value FROM settings WHERE key = ?',
        args: ['SYNC_API_KEY']
    });
    const apiKeySetting = apiKeySettingRes.rows[0];

    async function regenerateKey() {
        'use server';
        const newKey = 'recaro_sync_' + Math.random().toString(36).substring(2, 15);
        const db = getDb();
        await db.execute({
            sql: 'UPDATE settings SET value = ? WHERE key = ?',
            args: [newKey, 'SYNC_API_KEY']
        });
        revalidatePath('/admin/sync');
    }

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 className="text-3xl font-bold">ERP Synchronization</h1>
                    <p className="text-gray-500 mt-2">Monitor automated updates from MAGO and SAP systems.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Sync API Endpoint</div>
                    <code style={{ background: '#1a1a1a', padding: '6px 12px', borderRadius: '4px', fontSize: '13px' }}>
                        POST /api/sync/products
                    </code>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="card" style={{ background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)' }}>
                    <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Current API Key</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--red-light)' }}>
                        {apiKeySetting?.value as string}
                    </div>
                    <form action={regenerateKey} style={{ marginTop: '16px' }}>
                        <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                            Regenerate Key
                        </button>
                    </form>
                </div>

                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <h3 className="text-xl font-bold mb-4">Sync Statistics</h3>
                    <div style={{ display: 'flex', gap: '48px' }}>
                        <div>
                            <div style={{ color: '#888', fontSize: '13px' }}>Total Syncs</div>
                            <div style={{ fontSize: '32px', fontWeight: '800' }}>{logs.length}</div>
                        </div>
                        <div>
                            <div style={{ color: '#888', fontSize: '13px' }}>Success Rate</div>
                            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)' }}>
                                {logs.length > 0 ? ((logs.filter((l: any) => l.status === 'SUCCESS').length / logs.length) * 100).toFixed(0) : 0}%
                            </div>
                        </div>
                        <div>
                            <div style={{ color: '#888', fontSize: '13px' }}>Last Source</div>
                            <div style={{ fontSize: '32px', fontWeight: '800' }}>
                                {(logs[0] as any)?.source || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="text-xl font-bold mb-4">Operations Log</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>DateTime</th>
                            <th>Source</th>
                            <th>Status</th>
                            <th>Message / Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log: any) => (
                            <tr key={log.id}>
                                <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: '#888' }}>{log.created_at}</td>
                                <td>
                                    <span className="badge badge-gray">{log.source}</span>
                                </td>
                                <td>
                                    <span className={`badge ${log.status === 'SUCCESS' ? 'badge-green' : 'badge-red'}`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td style={{ fontSize: '13px' }}>{log.message}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && (
                    <div className="empty-state">No sync operations recorded yet.</div>
                )}
            </div>
        </div>
    );
}
