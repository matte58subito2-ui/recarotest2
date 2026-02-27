'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

interface NavbarProps {
    role?: string;
}

export default function Navbar({ role }: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    return (
        <nav className="navbar">
            <Link href="/catalog" style={{ display: 'flex', alignItems: 'center' }}>
                <Image src="/recaro_logo.png" alt="RECARO Logo" width={140} height={32} style={{ objectFit: 'contain', filter: 'invert(1)' }} />
            </Link>
            <div className="navbar-nav">
                <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
                    🏠 Home
                </Link>
                <Link href="/catalog" className={`nav-link ${pathname.startsWith('/catalog') ? 'active' : ''}`}>
                    🪑 Catalogue
                </Link>
                <Link href="/contact" className={`nav-link ${pathname.startsWith('/contact') ? 'active' : ''}`}>
                    ✉️ Contact
                </Link>
                {role === 'admin' && (
                    <Link href="/admin" className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}>
                        ⚙️ Admin
                    </Link>
                )}
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
}
