'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase';
import { FeedbackModal } from '@/components/screens/FeedbackModal';
import { SettingsPanel } from '@/components/screens/SettingsPanel';

const ADMIN_EMAIL = 'stevengalocr@gmail.com';

export default function PerfilPage() {
  const { lang } = useApp();
  const { user, profile } = useData();
  const router = useRouter();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = profile?.full_name ?? 'Usuario';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const planLabel = profile?.plan_status === 'active'
    ? (lang === 'es' ? 'Plan Pro' : 'Pro Plan')
    : profile?.plan_status === 'trial'
    ? (lang === 'es' ? 'Período de prueba' : '7-day Trial')
    : (lang === 'es' ? 'Gratuito' : 'Free');

  async function handleLogout() {
    setLoggingOut(true);
    await createClient().auth.signOut();
    router.replace('/login');
  }

  const financeLinks = [
    { href: '/dashboard/cuentas',      icon: 'bank',   label_es: 'Cuentas',       label_en: 'Accounts',    color: 'var(--blue)'   },
    { href: '/dashboard/presupuestos', icon: 'flag',   label_es: 'Presupuestos',  label_en: 'Budgets',     color: 'var(--cyan)'   },
    { href: '/dashboard/gastos-fijos', icon: 'shield', label_es: 'Gastos fijos',  label_en: 'Fixed exp.',  color: 'var(--income)' },
    { href: '/dashboard/reportes',     icon: 'chart',  label_es: 'Reportes',      label_en: 'Reports',     color: 'var(--violet)' },
  ] as const;

  return (
    <div className="page-enter" style={{ maxWidth: 520, margin: '0 auto', padding: '0 0 32px' }}>

      {/* User card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '20px', marginBottom: 20,
        background: 'var(--surface)', borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--gradient-hero)',
          display: 'grid', placeItems: 'center',
          fontSize: 20, fontWeight: 800, color: 'var(--btn-hero-text)',
          flexShrink: 0, letterSpacing: '-0.02em',
        }}>
          {profile?.avatar_url ? (
            <span style={{ fontSize: 26 }}>{profile.avatar_url}</span>
          ) : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email}
          </div>
          <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 999, background: 'color-mix(in oklab, var(--cyan) 12%, var(--surface-3))', border: '1px solid color-mix(in oklab, var(--cyan) 22%, var(--border))' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.02em' }}>{planLabel}</span>
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          style={{ width: 38, height: 38, borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-3)', flexShrink: 0 }}
          aria-label={lang === 'es' ? 'Configuración' : 'Settings'}
        >
          <Icon name="settings" size={17} stroke={1.6} />
        </button>
      </div>

      {/* Finance quick links */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 2 }}>
          {lang === 'es' ? 'Finanzas' : 'Finance'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {financeLinks.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 'var(--r-md)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              textDecoration: 'none', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `color-mix(in oklab, ${item.color} 14%, var(--surface-3))`,
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name={item.icon} size={18} stroke={1.8} style={{ color: item.color }} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
                {lang === 'es' ? item.label_es : item.label_en}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Support / Admin */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 2 }}>
          {lang === 'es' ? 'Soporte' : 'Support'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isAdmin && (
            <Link href="/dashboard/admin" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 'var(--r-md)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              textDecoration: 'none', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in oklab, var(--violet) 14%, var(--surface-3))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="lock" size={18} stroke={1.7} style={{ color: 'var(--violet)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{lang === 'es' ? 'Administración' : 'Admin panel'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{lang === 'es' ? 'Panel de control' : 'Manage users & feedback'}</div>
              </div>
              <Icon name="chevron-right" size={16} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
            </Link>
          )}

          {!isAdmin && (
            <button onClick={() => setFeedbackOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 'var(--r-md)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              width: '100%', textAlign: 'left', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in oklab, var(--violet) 14%, var(--surface-3))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="edit" size={18} stroke={1.7} style={{ color: 'var(--violet)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{lang === 'es' ? 'Reportar / Sugerir' : 'Report / Suggest'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{lang === 'es' ? 'Bugs, mejoras o consultas' : 'Bugs, improvements or questions'}</div>
              </div>
              <Icon name="chevron-right" size={16} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
            </button>
          )}
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} disabled={loggingOut} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderRadius: 'var(--r-md)',
        background: 'var(--expense-soft)', border: '1px solid rgba(255,107,131,0.2)',
        color: 'var(--expense)', fontSize: 13.5, fontWeight: 600,
        opacity: loggingOut ? 0.6 : 1, transition: 'opacity 150ms',
      }}>
        <Icon name="logout" size={18} stroke={1.7} />
        {loggingOut
          ? (lang === 'es' ? 'Cerrando sesión…' : 'Signing out…')
          : (lang === 'es' ? 'Cerrar sesión' : 'Sign out')}
      </button>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
