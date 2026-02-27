import Link from 'next/link';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div style={{ marginBottom: '32px', padding: '0 16px' }}>
                    <Link href="/">
                        <Image src="/recaro_logo.png" alt="RECARO Logo" width={160} height={36} style={{ objectFit: 'contain', cursor: 'pointer' }} />
                    </Link>
                </div>

                <div className="sidebar-section">Management</div>
                <Link href="/admin/stats" className="sidebar-link">
                    <span style={{ width: '24px' }}>📊</span> Statistics
                </Link>
                <Link href="/admin/requests" className="sidebar-link">
                    <span style={{ width: '24px' }}>👥</span> Registration Requests
                </Link>
                <Link href="/admin/orders" className="sidebar-link">
                    <span style={{ width: '24px' }}>📦</span> Orders / Quotes
                </Link>
                <Link href="/admin/import" className="sidebar-link">
                    <span style={{ width: '24px' }}>📥</span> Import Products (CSV)
                </Link>
                <Link href="/admin/sync" className="sidebar-link">
                    <span style={{ width: '24px' }}>🔄</span> ERP Synchronization
                </Link>

                <div className="sidebar-section" style={{ marginTop: '24px' }}>Security</div>
                <Link href="/admin/ips" className="sidebar-link">
                    <span style={{ width: '24px' }}>🛡️</span> IP Whitelist
                </Link>
                <Link href="/admin/devices" className="sidebar-link">
                    <span style={{ width: '24px' }}>💻</span> Authorized Devices
                </Link>
                <Link href="/admin/logs" className="sidebar-link">
                    <span style={{ width: '24px' }}>📜</span> Audit Logs
                </Link>

                <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
                    <Link href="/" className="btn btn-ghost" style={{ width: '100%' }}>← Back to Home</Link>
                </div>
            </aside>
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}
