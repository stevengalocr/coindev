import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoinDev — Tus finanzas, claras como el agua',
  description: 'Plataforma SaaS de finanzas personales diseñada para LATAM. Control total de tus movimientos, presupuestos y gastos fijos.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CoinDev',
  },
};

export const viewport: Viewport = {
  themeColor: '#0C0E14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" style={{ height: '100%' }}>
      <body style={{ height: '100%', background: 'var(--bg)', color: 'var(--text)' }}>
        {children}
      </body>
    </html>
  );
}
