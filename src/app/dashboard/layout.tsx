'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppProvider, useApp } from '@/hooks/useApp';
import { DataProvider, useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';
import { greet } from '@/lib/data';
import { SettingsPanel } from '@/components/screens/SettingsPanel';
import { AddMovementModal } from '@/components/screens/AddMovementModal';

const NAV_ITEMS = [
  { href: '/dashboard',              icon: 'home',   key: 'home'      },
  { href: '/dashboard/movimientos',  icon: 'list',   key: 'movements' },
  { href: '/dashboard/cuentas',      icon: 'bank',   key: 'accounts'  },
  { href: '/dashboard/presupuestos', icon: 'flag',   key: 'budgets'   },
  { href: '/dashboard/gastos-fijos', icon: 'shield', key: 'fixed'     },
  { href: '/dashboard/divisas',      icon: 'swap',   key: 'divisas'   },
  { href: '/dashboard/reportes',     icon: 'chart',  key: 'reports'   },
] as const;

const MOBILE_NAV = [
  { href: '/dashboard',             icon: 'home',  key: 'home'      },
  { href: '/dashboard/movimientos', icon: 'list',  key: 'movements' },
  null,
  { href: '/dashboard/reportes',    icon: 'chart', key: 'reports'   },
  { href: '/dashboard/cuentas',     icon: 'bank',  key: 'accounts'  },
] as const;

function DashInner({ children }: { children: ReactNode }) {
  const { t } = useApp();
  const { profile } = useData();
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const navLabels: Record<string, string> = {
    home: t.home, movements: t.movements, accounts: t.accounts,
    budgets: t.budgets, fixed: t.fixed, divisas: t.divisas, reports: t.reports,
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const displayName = profile?.full_name ?? 'Usuario';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: 236, flexShrink: 0, borderRight: '1px solid var(--border)',
        background: 'var(--bg-2)', display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0,
      }} className="hidden-mobile">

        <div style={{
          padding: '22px 20px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 11,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, background: 'var(--surface)',
            border: '1px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon name="logo" size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.2 }}>CoinDev</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2, lineHeight: 1 }}>{t.tagline}</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }} className="no-scrollbar">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.key} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                borderRadius: 'var(--r-md)', marginBottom: 2, textDecoration: 'none',
                color: active ? 'var(--text)' : 'var(--text-2)',
                background: active ? 'var(--surface)' : 'transparent',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
                fontWeight: active ? 600 : 400, fontSize: 13.5, transition: 'all 140ms',
                letterSpacing: '-0.01em',
              }}>
                <Icon name={item.icon} size={17} stroke={active ? 2 : 1.7} />
                {navLabels[item.key]}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: 'var(--gradient-hero)',
              display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
              color: '#0C0E14', flexShrink: 0,
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{displayName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                {profile?.plan === 'pro' ? 'Plan Pro' : 'Plan Free'} · CR
              </div>
            </div>
            <button
              style={{
                color: 'var(--text-3)', width: 28, height: 28, borderRadius: 8,
                display: 'grid', placeItems: 'center', transition: 'color 140ms, background 140ms', flexShrink: 0,
              }}
              aria-label={t.settings}
              onClick={() => setSettingsOpen(true)}
            >
              <Icon name="settings" size={15} stroke={1.6} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Column ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}
        className="no-scrollbar">

        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          background: 'color-mix(in oklab, var(--bg) 82%, transparent)',
          borderBottom: '1px solid var(--border)',
          padding: '0 28px', height: 62,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }} className="hidden-mobile">
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {greet(t, displayName.split(' ')[0])}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{dateCapitalized}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              padding: '0 12px', width: 280, height: 36,
            }}>
              <Icon name="search" size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <input placeholder={t.searchPlaceholder} style={{
                flex: 1, fontSize: 12.5, color: 'var(--text)',
                background: 'transparent', outline: 'none', border: 'none',
              }} />
            </div>

            <button style={{
              width: 36, height: 36, borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
              background: 'var(--surface)', display: 'grid', placeItems: 'center',
              color: 'var(--text-2)', position: 'relative', flexShrink: 0,
            }} aria-label={t.notifications}>
              <Icon name="bell" size={16} stroke={1.6} />
              <span style={{
                position: 'absolute', top: 8, right: 8, width: 6, height: 6,
                borderRadius: '50%', background: 'var(--expense)', border: '1.5px solid var(--surface)',
              }} />
            </button>

            <button onClick={() => setAddOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 36,
              borderRadius: 'var(--r-md)', background: 'var(--gradient-hero)',
              color: '#0C0E14', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <Icon name="plus" size={15} stroke={2.5} />
              + {t.newMovement}
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '24px 28px 100px', minWidth: 0 }} className="main-pad">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ──────────────────────────────────────── */}
      <nav style={{
        display: 'none', position: 'fixed', bottom: 18,
        left: '50%', transform: 'translateX(-50%)', zIndex: 50,
      }} className="mobile-nav">
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-pill)', boxShadow: 'var(--shadow-pop)',
          padding: '6px 10px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 0, alignItems: 'center',
        }}>
          {MOBILE_NAV.map((item) => {
            if (!item) {
              return (
                <div key="fab" style={{ display: 'flex', justifyContent: 'center', padding: '0 4px' }}>
                  <button
                    style={{
                      width: 54, height: 54, borderRadius: '50%', background: 'var(--gradient-hero)',
                      display: 'grid', placeItems: 'center', color: '#0C0E14',
                      boxShadow: '0 6px 24px rgba(91,155,255,0.45)', marginTop: -22, flexShrink: 0,
                    }}
                    aria-label={t.add}
                    onClick={() => setAddOpen(true)}
                  >
                    <Icon name="plus" size={22} stroke={2.5} />
                  </button>
                </div>
              );
            }
            const active = isActive(item.href);
            const mobileLabels: Record<string, string> = {
              home: t.home, movements: t.movements, reports: t.reports, accounts: t.accounts,
            };
            return (
              <Link key={item.key} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '7px 10px', borderRadius: 20, textDecoration: 'none',
                color: active ? 'var(--text)' : 'var(--text-3)',
                background: active ? 'var(--surface-2)' : 'transparent',
                minWidth: 50, transition: 'all 120ms',
              }}>
                <Icon name={item.icon} size={20} stroke={active ? 2 : 1.6} />
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.01em', lineHeight: 1 }}>
                  {mobileLabels[item.key]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-nav { display: block !important; }
          .main-pad { padding: 16px 16px 110px !important; }
        }
      `}</style>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AddMovementModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <DataProvider>
        <DashInner>{children}</DashInner>
      </DataProvider>
    </AppProvider>
  );
}
