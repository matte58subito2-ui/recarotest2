'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';

interface NavbarProps {
    role?: string;
}

export default function Navbar({ role }: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const cartItems = useCartStore((state) => state.items);

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    return (
        <nav className="navbar" style={{ flexDirection: 'column', height: 'auto', padding: '16px 32px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href="/catalog" style={{ display: 'flex', alignItems: 'center' }}>
                    <Image src="/recaro_logo.png" alt="RECARO Logo" width={140} height={32} style={{ objectFit: 'contain', filter: 'invert(1)' }} />
                </Link>
                <div className="navbar-nav">
                    <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
                        🏠 Home
                    </Link>
                    <Link href="/catalog" className={`nav-link ${pathname.startsWith('/catalog') ? 'active' : ''}`}>
                        🪑 Catalogo
                    </Link>
                    <Link href="/cart" className={`nav-link relative ${pathname.startsWith('/cart') ? 'active' : ''}`}>
                        🛒 Carrello
                        {cartItems.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                {cartItems.length}
                            </span>
                        )}
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
            </div>
            <div style={{ textAlign: 'left', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <span style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '11px', color: 'var(--text3)' }}>
                    Turning your ideas into reality.
                </span>
            </div>
        </nav>
    );
}
