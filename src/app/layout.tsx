import type { Metadata } from 'next';
import { Inter, Rajdhani } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const rajdhani = Rajdhani({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-rajdhani',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'RECARO B2B — Seat Configurator',
    description: 'Exclusive B2B platform for RECARO seat configuration and ordering.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en-US" className={`${inter.variable} ${rajdhani.variable}`}>
            <body>{children}</body>
        </html>
    );
}
