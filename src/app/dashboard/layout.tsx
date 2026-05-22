'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/hooks/useApp';
import { DataProvider, useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';
import { type Lang } from '@/lib/data';
import { SettingsPanel } from '@/components/screens/SettingsPanel';
import { AddMovementModal } from '@/components/screens/AddMovementModal';
import { TrialBanner } from '@/components/shell/TrialBanner';
import { ToastProvider } from '@/components/ui/Toast';
import { FeedbackModal } from '@/components/screens/FeedbackModal';

const ADMIN_EMAIL = 'stevengalocr@gmail.com';

const NAV_SECTIONS = [
  {
    label_es: 'Principal', label_en: 'Main',
    items: [
      { href: '/dashboard',             icon: 'home',  key: 'home'      },
      { href: '/dashboard/movimientos', icon: 'list',  key: 'movements' },
    ],
  },
  {
    label_es: 'Finanzas', label_en: 'Finance',
    items: [
      { href: '/dashboard/cuentas',      icon: 'bank',   key: 'accounts' },
      { href: '/dashboard/presupuestos', icon: 'flag',   key: 'budgets'  },
      { href: '/dashboard/metas',        icon: 'spark',  key: 'goals'    },
      { href: '/dashboard/gastos-fijos', icon: 'shield', key: 'fixed'    },
    ],
  },
  {
    label_es: 'Herramientas', label_en: 'Tools',
    items: [
      { href: '/dashboard/divisas',  icon: 'swap',  key: 'divisas' },
      { href: '/dashboard/reportes', icon: 'chart', key: 'reports' },
    ],
  },
] as const;

/* Bottom nav: [Metas] [Movimientos] [INICIO★] [Divisas] [Más] */
const MOBILE_LEFT = [
  { href: '/dashboard/metas',        icon: 'spark', key: 'goals'     },
  { href: '/dashboard/movimientos',  icon: 'list',  key: 'movements' },
] as const;

const MOBILE_RIGHT = [
  { href: '/dashboard/divisas', icon: 'swap', key: 'divisas' },
] as const;

const MOBILE_MORE = [
  { href: '/dashboard/cuentas',      icon: 'bank',   key: 'accounts' },
  { href: '/dashboard/presupuestos', icon: 'flag',   key: 'budgets'  },
  { href: '/dashboard/gastos-fijos', icon: 'shield', key: 'fixed'    },
  { href: '/dashboard/reportes',     icon: 'chart',  key: 'reports'  },
] as const;

function DashInner({ children }: { children: ReactNode }) {
  const { t, lang, setLang, setTheme } = useApp();
  const { user, profile, movements, accounts } = useData();

  useEffect(() => {
    if (!profile) return;
    if (profile.language) setLang(profile.language as Lang);
    if (profile.theme) setTheme(profile.theme as 'dark' | 'light');
  }, [profile, setLang, setTheme]);

  const pathname = usePathname();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Triple-click on Inicio → open Add Movement modal
  const homeClickCount = useRef(0);
  const homeClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleHomeClick(e: React.MouseEvent) {
    homeClickCount.current += 1;
    if (homeClickTimer.current) clearTimeout(homeClickTimer.current);
    if (homeClickCount.current >= 3) {
      e.preventDefault();
      homeClickCount.current = 0;
      setAddOpen(true);
      return;
    }
    homeClickTimer.current = setTimeout(() => { homeClickCount.current = 0; }, 500);
  }

  const navLabels: Record<string, string> = {
    home: t.home, movements: t.movements, accounts: t.accounts,
    budgets: t.budgets, goals: t.goals, fixed: t.fixed, divisas: t.divisas, reports: t.reports,
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const displayName = profile?.full_name ?? 'Usuario';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const planLabel = profile?.plan_status === 'active' ? (lang === 'es' ? 'Plan Activo' : 'Active Plan')
    : profile?.plan_status === 'trial' ? (lang === 'es' ? 'Prueba 7d' : '7d Trial')
    : profile?.plan_status === 'pending_payment' ? (lang === 'es' ? 'Pago pendiente' : 'Pending payment')
    : 'Free';

  const moreActive = MOBILE_MORE.some(item => isActive(item.href));
  const isHome = pathname === '/dashboard';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside style={{
        width: 248, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-2)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0,
      }} className="hidden-mobile">

        {/* Brand */}
        <div style={{ padding: '24px 20px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in oklab, var(--cyan) 12%, transparent), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <img src="/logo-64.png" alt="CoinDev" width={42} height={42} style={{ borderRadius: 14, flexShrink: 0, display: 'block' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>CoinDev</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3, letterSpacing: '0.01em' }}>{t.tagline}</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '0 14px 16px' }}>
          <button onClick={() => setAddOpen(true)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '10px 16px', borderRadius: 12,
            background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)',
            fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
            boxShadow: '0 2px 16px color-mix(in oklab, var(--cyan) 30%, transparent)',
            transition: 'opacity 150ms',
          }}>
            <Icon name="plus" size={15} stroke={2.6} />
            {lang === 'es' ? 'Nuevo movimiento' : 'New movement'}
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 14px 8px' }} />

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }} className="no-scrollbar">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, padding: '10px 10px 5px' }}>
                {lang === 'es' ? section.label_es : section.label_en}
              </div>
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.key} href={item.href}
                    onClick={item.key === 'home' ? handleHomeClick : undefined}
                    style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px 9px 12px',
                    borderRadius: 10, marginBottom: 1, textDecoration: 'none',
                    position: 'relative', overflow: 'hidden',
                    color: active ? 'var(--text)' : 'var(--text-2)',
                    background: active
                      ? 'linear-gradient(90deg, color-mix(in oklab, var(--cyan) 14%, var(--surface)), color-mix(in oklab, var(--cyan) 4%, var(--surface)) 100%)'
                      : 'transparent',
                    border: active ? '1px solid color-mix(in oklab, var(--cyan) 20%, var(--border))' : '1px solid transparent',
                    fontWeight: active ? 600 : 400, fontSize: 13.5,
                    letterSpacing: '-0.01em', transition: 'all 140ms',
                  }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {active && (
                      <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 999, background: 'var(--cyan)' }} />
                    )}
                    <Icon name={item.icon} size={17} stroke={active ? 2.1 : 1.7}
                      style={{ color: active ? 'var(--cyan)' : undefined, flexShrink: 0 }} />
                    {navLabels[item.key]}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Admin */}
          {user?.email === ADMIN_EMAIL && (() => {
            const active = isActive('/dashboard/admin');
            return (
              <Link href="/dashboard/admin" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px 9px 12px',
                borderRadius: 10, marginTop: 4, textDecoration: 'none',
                color: active ? 'var(--text)' : 'var(--text-2)',
                background: active ? 'color-mix(in oklab, var(--violet) 10%, var(--surface))' : 'transparent',
                border: active ? '1px solid color-mix(in oklab, var(--violet) 25%, var(--border))' : '1px solid transparent',
                fontWeight: active ? 600 : 400, fontSize: 13.5, letterSpacing: '-0.01em', transition: 'all 140ms',
              }}>
                <Icon name="shield" size={17} stroke={active ? 2 : 1.7} style={{ color: active ? 'var(--violet)' : undefined }} />
                Administración
              </Link>
            );
          })()}
        </nav>

        {/* Feedback — hidden for admin */}
        {user?.email !== ADMIN_EMAIL && (
          <div style={{ padding: '8px 14px 4px' }}>
            <button onClick={() => setFeedbackOpen(true)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 12px', borderRadius: 10, background: 'transparent',
              border: '1px solid transparent', color: 'var(--text-3)',
              fontSize: 12.5, fontWeight: 500, transition: 'all 140ms',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
            >
              <Icon name="edit" size={14} stroke={1.7} />
              {lang === 'es' ? 'Reportar problema / Sugerencia' : 'Report issue / Suggestion'}
            </button>
          </div>
        )}

        <div style={{ padding: '4px 14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-hero)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, color: 'var(--btn-hero-text)', flexShrink: 0, letterSpacing: '-0.02em' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 3, padding: '1px 7px', borderRadius: 999, background: 'color-mix(in oklab, var(--cyan) 12%, var(--surface-3))', border: '1px solid color-mix(in oklab, var(--cyan) 20%, var(--border))' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--cyan)', letterSpacing: '0.01em' }}>{planLabel}</span>
              </div>
            </div>
            <button style={{ color: 'var(--text-3)', width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', transition: 'color 140ms, background 140ms', flexShrink: 0 }}
              aria-label={t.settings} onClick={() => setSettingsOpen(true)}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
            >
              <Icon name="settings" size={15} stroke={1.6} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Column ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }} className="no-scrollbar">

        <TrialBanner />

        <main style={{ flex: 1, padding: '40px 36px 80px', minWidth: 0 }} className="main-pad">
          <div key={pathname} style={{ maxWidth: 1400, margin: '0 auto' }} className="page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav (floating) ─────────────────────────────────── */}
      <nav style={{
        display: 'none',
        position: 'fixed',
        bottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
        left: 14, right: 14,
        zIndex: 50,
        background: 'color-mix(in oklab, var(--bg-2) 96%, transparent)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 28,
        border: '1px solid var(--border)',
        boxShadow: '0 8px 36px rgba(0,0,0,0.32), 0 1px 0 color-mix(in oklab, white 6%, transparent) inset',
        height: 64,
      }} className="mobile-nav">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', alignItems: 'center', height: '100%', padding: '0 2px' }}>

          {/* Left: Metas + Movimientos */}
          {MOBILE_LEFT.map(item => {
            const active = isActive(item.href);
            const labels: Record<string, string> = { goals: t.goals, movements: t.movements };
            return (
              <Link key={item.key} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 4, height: '100%', textDecoration: 'none',
                color: active ? 'var(--cyan)' : 'var(--text-3)',
                transition: 'color 120ms',
              }}>
                <Icon name={item.icon} size={22} stroke={active ? 2.2 : 1.6} />
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, letterSpacing: '0.01em', lineHeight: 1 }}>
                  {labels[item.key]}
                </span>
              </Link>
            );
          })}

          {/* Center: Inicio FAB — triple-click opens Add Movement */}
          <Link href="/dashboard" onClick={handleHomeClick} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 5, height: '100%', textDecoration: 'none',
            transform: 'translateY(-10px)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--gradient-hero)',
              display: 'grid', placeItems: 'center',
              flexShrink: 0,
              boxShadow: isHome
                ? '0 0 0 4px color-mix(in oklab, var(--cyan) 28%, transparent), 0 8px 28px color-mix(in oklab, var(--cyan) 45%, transparent)'
                : '0 4px 20px rgba(0,0,0,0.45)',
              opacity: isHome ? 1 : 0.86,
              transition: 'box-shadow 200ms, opacity 200ms',
            }}>
              <Icon name="home" size={24} stroke={2.2} style={{ color: 'var(--btn-hero-text)' }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: isHome ? 'var(--text)' : 'var(--text-3)', lineHeight: 1 }}>
              {lang === 'es' ? 'Inicio' : 'Home'}
            </span>
          </Link>

          {/* Right: Divisas */}
          {MOBILE_RIGHT.map(item => {
            const active = isActive(item.href);
            const labels: Record<string, string> = { divisas: t.divisas };
            return (
              <Link key={item.key} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 4, height: '100%', textDecoration: 'none',
                color: active ? 'var(--cyan)' : 'var(--text-3)',
                transition: 'color 120ms',
              }}>
                <Icon name={item.icon} size={22} stroke={active ? 2.2 : 1.6} />
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, letterSpacing: '0.01em', lineHeight: 1 }}>
                  {labels[item.key]}
                </span>
              </Link>
            );
          })}

          {/* Más */}
          <button onClick={() => setMoreOpen(v => !v)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4, height: '100%', background: 'transparent', border: 0,
            color: moreActive ? 'var(--cyan)' : moreOpen ? 'var(--text)' : 'var(--text-3)',
            transition: 'color 120ms',
          }}>
            <Icon name="more" size={22} stroke={moreOpen ? 2.2 : 1.6} />
            <span style={{ fontSize: 9, fontWeight: moreOpen || moreActive ? 700 : 400, letterSpacing: '0.01em', lineHeight: 1 }}>
              {lang === 'es' ? 'Más' : 'More'}
            </span>
          </button>
        </div>
      </nav>

      {/* ── Mobile "Más" popup ───────────────────────────────────────────── */}
      {moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(3,6,15,0.55)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'fixed',
            bottom: 'calc(18px + 64px + env(safe-area-inset-bottom, 0px) + 10px)',
            left: '50%', transform: 'translateX(-50%)',
            zIndex: 49,
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 22, padding: '10px',
            width: 'calc(100% - 28px)', maxWidth: 360,
            boxShadow: '0 -8px 40px rgba(0,0,0,0.45)',
            animation: 'cd-slide-up 200ms cubic-bezier(0.2,0.8,0.2,1)',
          }}>
            <style>{`@keyframes cd-slide-up { from { transform: translateX(-50%) translateY(20px); opacity:0 } to { transform: translateX(-50%) translateY(0); opacity:1 } }`}</style>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {MOBILE_MORE.map(item => {
                const active = isActive(item.href);
                const moreLabels: Record<string, string> = { accounts: t.accounts, budgets: t.budgets, fixed: t.fixed, reports: t.reports };
                return (
                  <Link key={item.key} href={item.href} onClick={() => setMoreOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 14, textDecoration: 'none',
                    background: active ? 'color-mix(in oklab, var(--cyan) 10%, var(--surface))' : 'var(--surface)',
                    border: `1px solid ${active ? 'color-mix(in oklab, var(--cyan) 30%, var(--border))' : 'var(--border)'}`,
                    color: active ? 'var(--cyan)' : 'var(--text-2)',
                    transition: 'all 140ms',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: active ? 'color-mix(in oklab, var(--cyan) 15%, var(--surface-3))' : 'var(--surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name={item.icon} size={18} stroke={active ? 2.2 : 1.6} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, lineHeight: 1.2 }}>
                      {moreLabels[item.key]}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '10px 2px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {user?.email === ADMIN_EMAIL && (
                <Link href="/dashboard/admin" onClick={() => setMoreOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px', borderRadius: 14, textDecoration: 'none',
                  background: isActive('/dashboard/admin') ? 'color-mix(in oklab, var(--blue) 10%, var(--surface))' : 'var(--surface)',
                  border: `1px solid ${isActive('/dashboard/admin') ? 'color-mix(in oklab, var(--blue) 25%, var(--border))' : 'var(--border)'}`,
                  color: isActive('/dashboard/admin') ? 'var(--blue)' : 'var(--text-2)',
                  fontSize: 13, fontWeight: 500,
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'color-mix(in oklab, var(--blue) 10%, var(--surface-3))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="lock" size={18} stroke={1.6} style={{ color: 'var(--blue)' }} />
                  </div>
                  {lang === 'es' ? 'Administración' : 'Admin'}
                </Link>
              )}

              {user?.email !== ADMIN_EMAIL && (
                <button onClick={() => { setMoreOpen(false); setFeedbackOpen(true); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px', borderRadius: 14, background: 'var(--surface)',
                  border: '1px solid var(--border)', color: 'var(--text-2)',
                  fontSize: 13, fontWeight: 500,
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'color-mix(in oklab, var(--violet) 10%, var(--surface-3))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="edit" size={18} stroke={1.6} style={{ color: 'var(--violet)' }} />
                  </div>
                  {lang === 'es' ? 'Reportar / Sugerir' : 'Report / Suggest'}
                </button>
              )}

              <button onClick={() => { setMoreOpen(false); setSettingsOpen(true); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 14, background: 'var(--surface)',
                border: '1px solid var(--border)', color: 'var(--text-2)',
                fontSize: 13, fontWeight: 500,
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="settings" size={18} stroke={1.6} />
                </div>
                {lang === 'es' ? 'Configuración' : 'Settings'}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-nav { display: block !important; }
          .main-pad { padding: 24px 20px 126px !important; }
        }
      `}</style>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AddMovementModal open={addOpen} onClose={() => setAddOpen(false)} />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <DataProvider>
        <ToastProvider>
          <DashInner>{children}</DashInner>
        </ToastProvider>
      </DataProvider>
    </AppProvider>
  );
}
