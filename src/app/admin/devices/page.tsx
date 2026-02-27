import getDb from '@/lib/db';
import { revalidatePath } from 'next/cache';

export default async function DevicesPage() {
    const db = getDb();
    const devicesRes = await db.execute(`
        SELECT f.*, u.username 
        FROM user_fingerprints f 
        JOIN users u ON f.user_id = u.id 
        ORDER BY f.last_used DESC
    `);
    const devices = devicesRes.rows;

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

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="text-3xl font-bold">Authorized Devices</h1>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Device Fingerprint</th>
                            <th>Label</th>
                            <th>Last Used</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map((d: any) => (
                            <tr key={d.id}>
                                <td style={{ fontWeight: '600' }}>{d.username}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888' }}>
                                    {(d.fingerprint as string).substring(0, 16)}...
                                </td>
                                <td>
                                    <span className="badge badge-gray">{d.label || 'Unknown'}</span>
                                </td>
                                <td>{d.last_used}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <form action={deleteDevice}>
                                        <input type="hidden" name="id" value={d.id} />
                                        <button type="submit" className="btn btn-sm btn-danger">
                                            Revoke Access
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {devices.length === 0 && (
                            <tr>
                                <td colSpan={5} className="empty-state">
                                    No authorized devices yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(196,30,30,0.05)', borderRadius: '12px', border: '1px solid rgba(196,30,30,0.2)' }}>
                <h3 className="text-red-600 font-bold mb-2">Security Note</h3>
                <p className="text-sm text-gray-500">
                    Fingerprinting binds a user account to a specific browser installation.
                    Revoking access will force the user to re-authorize through the MFA (OTP) flow on their next login.
                </p>
            </div>
        </div>
    );
}
