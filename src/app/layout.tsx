import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'RECARO B2B — Configuratore Sedili',
    description: 'Piattaforma B2B riservata per la configurazione e l\'ordine di sedili RECARO.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="it">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
            </head>
            <body>{children}</body>
        </html>
    );
}
