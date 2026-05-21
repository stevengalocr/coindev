'use client';

import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/hooks/useApp';
import { DataProvider, useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';
import { greet, fmtMoney, type Lang, type Currency } from '@/lib/data';
import { SettingsPanel } from '@/components/screens/SettingsPanel';
import { AddMovementModal } from '@/components/screens/AddMovementModal';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, type DbNotification } from '@/lib/db';
import { TrialBanner } from '@/components/shell/TrialBanner';
import { ToastProvider } from '@/components/ui/Toast';

const ADMIN_EMAIL = 'stevengalocr@gmail.com';

const NAV_ITEMS = [
  { href: '/dashboard',              icon: 'home',   key: 'home'      },
  { href: '/dashboard/movimientos',  icon: 'list',   key: 'movements' },
  { href: '/dashboard/cuentas',      icon: 'bank',   key: 'accounts'  },
  { href: '/dashboard/presupuestos', icon: 'flag',   key: 'budgets'   },
  { href: '/dashboard/metas',        icon: 'spark',  key: 'goals'     },
  { href: '/dashboard/gastos-fijos', icon: 'shield', key: 'fixed'     },
  { href: '/dashboard/divisas',      icon: 'swap',   key: 'divisas'   },
  { href: '/dashboard/reportes',     icon: 'chart',  key: 'reports'   },
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
  const { t, lang, currency, setLang, setCurrency, setTheme } = useApp();
  const { user, profile, unreadNotifications, movements, accounts } = useData();

  // Sync profile preferences (language, currency, theme) to app state on load
  useEffect(() => {
    if (!profile) return;
    if (profile.language) setLang(profile.language as Lang);
    if (profile.default_currency) setCurrency(profile.default_currency as Currency);
    if (profile.theme) setTheme(profile.theme as 'dark' | 'light');
  }, [profile, setLang, setCurrency, setTheme]);
  const pathname = usePathname();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const openNotif = useCallback(async () => {
    setNotifOpen(v => !v);
    if (!notifOpen) {
      setNotifLoading(true);
      try { setNotifications(await fetchNotifications()); } catch {}
      setNotifLoading(false);
    }
  }, [notifOpen]);

  const handleMarkRead = useCallback(async (id: string) => {
    await markNotificationRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const handleMarkAll = useCallback(async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const searchMovements = q.length >= 2
    ? movements.filter(m => m.desc.toLowerCase().includes(q)).slice(0, 5)
    : [];
  const searchAccounts = q.length >= 2
    ? accounts.filter(a => a.name.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const navLabels: Record<string, string> = {
    home: t.home, movements: t.movements, accounts: t.accounts,
    budgets: t.budgets, goals: t.goals, fixed: t.fixed, divisas: t.divisas, reports: t.reports,
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const today = new Date();
  const dateStr = today.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const displayName = profile?.full_name ?? 'Usuario';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const moreActive = MOBILE_MORE.some(item => isActive(item.href));
  const isHome = pathname === '/dashboard';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside style={{
        width: 236, flexShrink: 0, borderRight: '1px solid var(--border)',
        background: 'var(--bg-2)', display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0,
      }} className="hidden-mobile">
        <div style={{ padding: '22px 20px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 11, height: 84, boxSizing: 'border-box' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
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
          {/* Admin-only link */}
          {user?.email === ADMIN_EMAIL && (() => {
            const active = isActive('/dashboard/admin');
            return (
              <Link href="/dashboard/admin" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                borderRadius: 'var(--r-md)', marginTop: 6, textDecoration: 'none',
                color: active ? 'var(--text)' : 'var(--text-2)',
                background: active ? 'color-mix(in oklab, var(--blue) 10%, var(--surface))' : 'transparent',
                border: active ? '1px solid color-mix(in oklab, var(--blue) 30%, var(--border))' : '1px solid transparent',
                fontWeight: active ? 600 : 400, fontSize: 13.5, transition: 'all 140ms',
                letterSpacing: '-0.01em',
              }}>
                <Icon name="shield" size={17} stroke={active ? 2 : 1.7} />
                Administración
              </Link>
            );
          })()}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gradient-hero)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: '#0C0E14', flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                {profile?.plan_status === 'active' ? 'Plan Activo' : profile?.plan_status === 'trial' ? 'Prueba 7d' : profile?.plan_status === 'pending_payment' ? 'Pago pendiente' : 'Plan Free'} · CR
              </div>
            </div>
            <button style={{ color: 'var(--text-3)', width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', transition: 'color 140ms, background 140ms', flexShrink: 0 }} aria-label={t.settings} onClick={() => setSettingsOpen(true)}>
              <Icon name="settings" size={15} stroke={1.6} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Column ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }} className="no-scrollbar">

        {/* Desktop header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          background: 'color-mix(in oklab, var(--bg) 82%, transparent)',
          borderBottom: '1px solid var(--border)',
          padding: '0 36px', height: 84,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }} className="hidden-mobile">
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {greet(t, displayName.split(' ')[0])}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{dateCapitalized}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: `1px solid ${searchOpen ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', padding: '0 12px', width: 280, height: 36, transition: 'border-color 150ms' }}>
                <Icon name="search" size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <input
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  style={{ flex: 1, fontSize: 12.5, color: 'var(--text)', background: 'transparent', outline: 'none', border: 'none' }}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} style={{ color: 'var(--text-3)', flexShrink: 0, lineHeight: 0 }}>
                    <Icon name="x" size={12} />
                  </button>
                )}
              </div>
              {searchOpen && q.length >= 2 && (searchMovements.length > 0 || searchAccounts.length > 0) && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: '100%', minWidth: 280,
                  background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 60, overflow: 'hidden',
                }}>
                  {searchAccounts.length > 0 && (
                    <div>
                      <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {lang === 'es' ? 'Cuentas' : 'Accounts'}
                      </div>
                      {searchAccounts.map(a => (
                        <button key={a.id} onClick={() => { router.push('/dashboard/cuentas'); setSearchOpen(false); setSearchQuery(''); }} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                          background: 'transparent', border: 0, textAlign: 'left', cursor: 'pointer',
                          transition: 'background 100ms',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: a.color, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtMoney(a.balance, currency)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchMovements.length > 0 && (
                    <div>
                      <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {lang === 'es' ? 'Movimientos' : 'Movements'}
                      </div>
                      {searchMovements.map(m => (
                        <button key={m.id} onClick={() => { router.push('/dashboard/movimientos'); setSearchOpen(false); setSearchQuery(''); }} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                          background: 'transparent', border: 0, textAlign: 'left', cursor: 'pointer',
                          transition: 'background 100ms',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: m.type === 'income' ? 'var(--income-soft)' : 'var(--expense-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <Icon name={m.type === 'income' ? 'arrow-up' : 'arrow-down'} size={13} stroke={2} style={{ color: m.type === 'income' ? 'var(--income)' : 'var(--expense)' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.desc}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtMoney(m.amount, currency)} · {m.date.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'short' })}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ height: 6 }} />
                </div>
              )}
              {searchOpen && q.length >= 2 && searchMovements.length === 0 && searchAccounts.length === 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: '100%',
                  background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 60,
                  padding: '16px 14px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center',
                }}>
                  {lang === 'es' ? 'Sin resultados' : 'No results'}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={openNotif} style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', border: `1px solid ${notifOpen ? 'var(--blue)' : 'var(--border)'}`, background: notifOpen ? 'color-mix(in oklab, var(--blue) 8%, var(--surface))' : 'var(--surface)', display: 'grid', placeItems: 'center', color: 'var(--text-2)', position: 'relative', flexShrink: 0, transition: 'all 140ms' }} aria-label={t.notifications}>
                <Icon name="bell" size={16} stroke={1.6} />
                {unreadNotifications > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, background: 'var(--expense)', border: '1.5px solid var(--surface)', fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: '0 3px' }}>
                    {unreadNotifications <= 9 ? unreadNotifications : '9+'}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 320,
                  background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 60, overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                      {lang === 'es' ? 'Notificaciones' : 'Notifications'}
                    </div>
                    {notifications.some(n => !n.is_read) && (
                      <button onClick={handleMarkAll} style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, background: 'none', border: 0, cursor: 'pointer' }}>
                        {lang === 'es' ? 'Marcar todas' : 'Mark all read'}
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }} className="no-scrollbar">
                    {notifLoading ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                        {lang === 'es' ? 'Cargando…' : 'Loading…'}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                        {lang === 'es' ? 'Sin notificaciones' : 'No notifications'}
                      </div>
                    ) : (
                      notifications.map(n => (
                        <button key={n.id} onClick={() => handleMarkRead(n.id)} style={{
                          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
                          background: n.is_read ? 'transparent' : 'color-mix(in oklab, var(--blue) 5%, var(--surface))',
                          border: 0, borderBottom: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer',
                          transition: 'background 100ms',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                          onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : 'color-mix(in oklab, var(--blue) 5%, var(--surface))')}
                        >
                          {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 5 }} />}
                          {n.is_read && <div style={{ width: 6, flexShrink: 0 }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4 }}>
                              {new Date(n.created_at).toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setAddOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 36, borderRadius: 'var(--r-md)', background: 'var(--gradient-hero)', color: '#0C0E14', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Icon name="plus" size={15} stroke={2.5} />
              + {t.newMovement}
            </button>
          </div>
        </header>

        <TrialBanner />

        <main style={{ flex: 1, padding: '44px 36px 100px', minWidth: 0 }} className="main-pad">
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────────── */}
      <nav style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'color-mix(in oklab, var(--bg-2) 96%, transparent)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        padding: '0 4px calc(env(safe-area-inset-bottom, 0px))',
        height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
      }} className="mobile-nav">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', alignItems: 'flex-end', maxWidth: 500, margin: '0 auto', height: 62 }}>

          {/* Left: Metas + Movimientos */}
          {MOBILE_LEFT.map(item => {
            const active = isActive(item.href);
            const labels: Record<string, string> = { goals: t.goals, movements: t.movements };
            return (
              <Link key={item.key} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 0 10px', textDecoration: 'none',
                color: active ? 'var(--blue)' : 'var(--text-3)',
                transition: 'color 120ms',
              }}>
                <Icon name={item.icon} size={22} stroke={active ? 2.2 : 1.6} />
                <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 400, letterSpacing: '0.01em', lineHeight: 1 }}>
                  {labels[item.key]}
                </span>
              </Link>
            );
          })}

          {/* Center: Inicio FAB */}
          {(() => {
            return (
              <Link href="/dashboard" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                textDecoration: 'none', transform: 'translateY(-10px)', padding: '0 0 4px',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'var(--gradient-hero)',
                  display: 'grid', placeItems: 'center',
                  boxShadow: isHome
                    ? '0 0 0 3px color-mix(in oklab, var(--cyan) 35%, transparent), 0 6px 24px color-mix(in oklab, var(--cyan) 45%, transparent)'
                    : '0 4px 18px rgba(0,0,0,0.5)',
                  opacity: isHome ? 1 : 0.82,
                  transition: 'box-shadow 200ms, opacity 200ms',
                }}>
                  <Icon name="home" size={26} stroke={2.2} style={{ color: '#0C0E14' }} />
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: isHome ? 'var(--text)' : 'var(--text-3)', lineHeight: 1 }}>
                  {lang === 'es' ? 'Inicio' : 'Home'}
                </span>
              </Link>
            );
          })()}

          {/* Right: Divisas */}
          {MOBILE_RIGHT.map(item => {
            const active = isActive(item.href);
            const labels: Record<string, string> = { divisas: t.divisas };
            return (
              <Link key={item.key} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 0 10px', textDecoration: 'none',
                color: active ? 'var(--blue)' : 'var(--text-3)',
                transition: 'color 120ms',
              }}>
                <Icon name={item.icon} size={22} stroke={active ? 2.2 : 1.6} />
                <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 400, letterSpacing: '0.01em', lineHeight: 1 }}>
                  {labels[item.key]}
                </span>
              </Link>
            );
          })}

          {/* Más */}
          <button
            onClick={() => setMoreOpen(v => !v)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 0 10px', background: 'transparent', border: 0,
              color: moreActive ? 'var(--blue)' : moreOpen ? 'var(--text)' : 'var(--text-3)',
              transition: 'color 120ms',
            }}
          >
            <Icon name="more" size={22} stroke={moreOpen ? 2.2 : 1.6} />
            <span style={{ fontSize: 9.5, fontWeight: moreOpen || moreActive ? 700 : 400, letterSpacing: '0.01em', lineHeight: 1 }}>
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
            position: 'fixed', bottom: 'calc(66px + env(safe-area-inset-bottom, 0px))', left: '50%',
            transform: 'translateX(-50%)', zIndex: 49,
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 22, padding: '10px', width: 'calc(100% - 28px)', maxWidth: 360,
            boxShadow: '0 -8px 40px rgba(0,0,0,0.45)',
            animation: 'cd-slide-up 200ms cubic-bezier(0.2,0.8,0.2,1)',
          }}>
            <style>{`@keyframes cd-slide-up { from { transform: translateX(-50%) translateY(20px); opacity:0 } to { transform: translateX(-50%) translateY(0); opacity:1 } }`}</style>

            {/* 2×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {MOBILE_MORE.map(item => {
                const active = isActive(item.href);
                const moreLabels: Record<string, string> = { accounts: t.accounts, budgets: t.budgets, fixed: t.fixed, reports: t.reports };
                return (
                  <Link key={item.key} href={item.href} onClick={() => setMoreOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 14, textDecoration: 'none',
                    background: active ? 'color-mix(in oklab, var(--blue) 12%, var(--surface))' : 'var(--surface)',
                    border: `1px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
                    color: active ? 'var(--blue)' : 'var(--text-2)',
                    transition: 'all 140ms',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: active ? 'color-mix(in oklab, var(--blue) 18%, var(--surface-3))' : 'var(--surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
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
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-nav { display: block !important; }
          .main-pad { padding: 20px 16px 100px !important; }
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
        <ToastProvider>
          <DashInner>{children}</DashInner>
        </ToastProvider>
      </DataProvider>
    </AppProvider>
  );
}
