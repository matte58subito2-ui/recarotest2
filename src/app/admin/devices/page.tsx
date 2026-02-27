import getDb from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function DevicesPage() {
    const db = getDb();
    const devicesRes = await db.execute(`
        SELECT f.*, u.username, u.id as user_id
        FROM user_fingerprints f 
        JOIN users u ON f.user_id = u.id 
        ORDER BY f.is_approved ASC, f.last_used DESC
    `);
    const devices = devicesRes.rows;

    async function toggleApproval(formData: FormData) {
        'use server';
        const id = formData.get('id');
        const currentStatus = Number(formData.get('status'));
        const db = getDb();
        await db.execute({
            sql: 'UPDATE user_fingerprints SET is_approved = ? WHERE id = ?',
            args: [currentStatus === 1 ? 0 : 1, id as string]
        });

        // Audit log
        const device = (await db.execute({ sql: 'SELECT * FROM user_fingerprints WHERE id = ?', args: [id as string] })).rows[0];
        if (device) {
            await db.execute({
                sql: 'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
                args: [Number(device.user_id), currentStatus === 1 ? 'DEVICE_REVOKED' : 'DEVICE_APPROVED', JSON.stringify({ fingerprint: device.fingerprint })]
            });
        }

        revalidatePath('/admin/devices');
    }

    async function deleteDevice(formData: FormData) {
        'use server';
        const id = formData.get('id');
        const db = getDb();
        await db.execute({
            sql: 'DELETE FROM user_fingerprints WHERE id = ?',
            args: [id as string]
        });
        revalidatePath('/admin/devices');
    }

    async function revokeAllUserSessions(formData: FormData) {
        'use server';
        const userId = formData.get('userId');
        const db = getDb();

        // 1. Set revoked_all_at to now
        await db.execute({
            sql: 'UPDATE users SET revoked_all_at = (datetime(\'now\')) WHERE id = ?',
            args: [userId as string]
        });

        // 2. Revoke all fingerprints for this user (optional but safer)
        await db.execute({
            sql: 'UPDATE user_fingerprints SET is_approved = 0 WHERE user_id = ?',
            args: [userId as string]
        });

        // 3. Audit log
        await db.execute({
            sql: 'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
            args: [userId as string, 'REVOKE_ALL_SESSIONS', JSON.stringify({ reason: 'Admin Action' })]
        });

        revalidatePath('/admin/devices');
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="text-3xl font-bold">Device Management</h1>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Fingerprint</th>
                            <th>Status</th>
                            <th>Metadata</th>
                            <th>Last Used</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map((d: any) => (
                            <tr key={d.id} style={d.is_approved === 0 ? { background: 'rgba(196,30,30,0.03)' } : {}}>
                                <td style={{ fontWeight: '600' }}>{d.username}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888' }}>
                                    {(d.fingerprint as string).substring(0, 16)}...
                                </td>
                                <td>
                                    <span className={`badge ${d.is_approved === 1 ? 'badge-green' : 'badge-red'}`}>
                                        {d.is_approved === 1 ? 'Approved' : 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ fontSize: '11px', color: '#888' }}>
                                        IP: {d.last_ip || '—'}<br />
                                        UA: {(d.user_agent as string || '').substring(0, 30)}...
                                    </div>
                                </td>
                                <td style={{ fontSize: '12px' }}>{d.last_used}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <form action={toggleApproval}>
                                            <input type="hidden" name="id" value={d.id} />
                                            <input type="hidden" name="status" value={d.is_approved} />
                                            <button type="submit" className={`btn btn-sm ${d.is_approved === 1 ? 'btn-ghost' : 'btn-primary'}`}>
                                                {d.is_approved === 1 ? 'Disable' : 'Approve'}
                                            </button>
                                        </form>

                                        <form action={revokeAllUserSessions}>
                                            <input type="hidden" name="userId" value={d.user_id} />
                                            <button type="submit" className="btn btn-sm btn-danger">
                                                Kill All
                                            </button>
                                        </form>

                                        <form action={deleteDevice}>
                                            <input type="hidden" name="id" value={d.id} />
                                            <button type="submit" className="btn btn-sm btn-ghost" style={{ color: '#888' }}>
                                                Delete
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {devices.length === 0 && (
                            <tr>
                                <td colSpan={6} className="empty-state">
                                    No devices registered yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(196,30,30,0.05)', borderRadius: '12px', border: '1px solid rgba(196,30,30,0.2)' }}>
                <h3 className="text-red-600 font-bold mb-2">Hardware Fingerprinting Security</h3>
                <p className="text-sm text-gray-500">
                    Each device must be manually approved by an administrator. Revoking access will block the device immediately.
                    The <strong>"Kill All"</strong> action invalidates all active session tokens for that user.
                </p>
            </div>
        </div>
    );
}
