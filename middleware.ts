import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './src/lib/auth';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes (no auth required)
    const publicPaths = ['/login', '/403', '/api/auth/login'];
    if (publicPaths.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Static assets
    if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
        return NextResponse.next();
    }

    // Check IP whitelist via API (we'll do this check in the API routes / page server components)
    // Here we just check JWT session
    const token = request.cookies.get('recaro_session')?.value;
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const user = verifyToken(token);
    if (!user) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Admin only routes
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
        return NextResponse.redirect(new URL('/catalog', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
