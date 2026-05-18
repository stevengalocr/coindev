import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoinDev — Tus finanzas, claras como el agua',
  description: 'Plataforma SaaS de finanzas personales diseñada para LATAM. Control total de tus movimientos, presupuestos y gastos fijos.',
  icons: {
    icon: '/favicon.ico',
  },
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
