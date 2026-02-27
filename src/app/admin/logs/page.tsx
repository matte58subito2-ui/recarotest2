import getDb from '@/lib/db';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
    headers(); // Force dynamic
    const db = getDb();
    const logsRes = await db.execute(`
        SELECT l.*, u.username 
        FROM audit_logs l 
        LEFT JOIN users u ON l.user_id = u.id 
        ORDER BY l.created_at DESC 
        LIMIT 100
    `);

    // Aggressive sanitization for Next.js serialization
    const logs = logsRes.rows.map(row => ({
        id: String(row.id || ''),
        created_at: String(row.created_at || ''),
        user_id: String(row.user_id || ''),
        username: String(row.username || 'System'),
        action: String(row.action || ''),
        ip_address: String(row.ip_address || ''),
        device_id: String(row.device_id || ''),
        details: String(row.details || '')
    }));

    const getActionColor = (action: string) => {
        if (action.includes('SUCCESS')) return '#22c55e';
        if (action.includes('BLOCKED') || action.includes('REVOKE')) return '#ef4444';
        if (action.includes('PENDING')) return '#eab308';
        return '#3b82f6';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="text-3xl font-bold">Security Audit Logs</h1>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>IP Address</th>
                            <th>Device ID</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log: any) => (
                            <tr key={log.id}>
                                <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                                    {log.created_at}
                                </td>
                                <td style={{ fontWeight: '600' }}>
                                    {log.username || 'System'}
                                </td>
                                <td>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        background: `${getActionColor(log.action as string)}20`,
                                        color: getActionColor(log.action as string),
                                        border: `1px solid ${getActionColor(log.action as string)}40`
                                    }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                    {log.ip_address}
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888' }}>
                                    {log.device_id ? log.device_id.substring(0, 12) + '...' : '—'}
                                </td>
                                <td style={{ fontSize: '11px', color: '#666', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {log.details || '—'}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="empty-state">
                                    No logs recorded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p style={{ marginTop: '16px', fontSize: '12px', color: '#888' }}>
                Showing the last 100 security events. Logs are immutable and synchronized with the central server.
            </p>
        </div>
    );
}
