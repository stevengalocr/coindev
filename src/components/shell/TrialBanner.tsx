'use client';

import { useData } from '@/hooks/useData';
import { useApp } from '@/hooks/useApp';
import { Icon } from '@/components/ui/Icon';

const ADMIN_EMAIL = 'stevengalocr@gmail.com';
const TRIAL_DAYS = 7;

function daysLeftInTrial(trialStartedAt: string | null): number {
  if (!trialStartedAt) return TRIAL_DAYS;
  const start = new Date(trialStartedAt);
  const end = new Date(start.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}

export function TrialBanner() {
  const { profile, user } = useData();
  const { lang } = useApp();

  // Don't show for admin or while loading
  if (!profile || !user) return null;
  if (user.email === ADMIN_EMAIL) return null;

  const status = profile.plan_status ?? 'trial';

  // Active paid plan — no banner
  if (status === 'active') return null;

  const isEs = lang === 'es';
  const days = daysLeftInTrial(profile.trial_started_at);

  if (status === 'trial') {
    const urgent = days <= 2;
    const color = urgent ? '#F59E0B' : '#5B9BFF';
    const bg = urgent ? 'rgba(245,158,11,0.06)' : 'rgba(91,155,255,0.05)';
    const border = urgent ? 'rgba(245,158,11,0.18)' : 'rgba(91,155,255,0.14)';
    const label = days === 0
      ? (isEs ? 'Tu prueba gratuita ha expirado' : 'Your free trial has expired')
      : days === 1
        ? (isEs ? '¡Último día de prueba gratuita!' : 'Last day of your free trial!')
        : (isEs ? `Prueba gratuita · ${days} días restantes` : `Free trial · ${days} days left`);

    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, padding: '8px 24px',
        background: bg, borderBottom: `1px solid ${border}`,
        flexWrap: 'wrap',
      }} className="trial-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0,
            boxShadow: `0 0 6px ${color}` }} />
          <span style={{ fontSize: 12.5, fontWeight: 500, color }}>
            {label}
          </span>
        </div>
        <a href="mailto:stevengalocr@gmail.com" style={{
          fontSize: 11.5, fontWeight: 600, color,
          padding: '4px 12px', borderRadius: 999,
          border: `1px solid ${border}`,
          background: `color-mix(in oklab, ${color} 8%, transparent)`,
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          {isEs ? 'Actualizar plan' : 'Upgrade plan'}
        </a>
      </div>
    );
  }

  if (status === 'pending_payment') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, padding: '9px 24px',
        background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.18)',
        flexWrap: 'wrap',
      }} className="trial-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="bell" size={13} stroke={2} style={{ color: '#EF4444', flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 500, color: '#EF4444' }}>
            {isEs ? 'Plan expirado · Pago pendiente para continuar' : 'Plan expired · Payment required to continue'}
          </span>
        </div>
        <a href="mailto:stevengalocr@gmail.com" style={{
          fontSize: 11.5, fontWeight: 700, color: '#EF4444',
          padding: '4px 12px', borderRadius: 999,
          border: '1px solid rgba(239,68,68,0.25)',
          background: 'rgba(239,68,68,0.08)',
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          {isEs ? 'Contactar soporte' : 'Contact support'}
        </a>
      </div>
    );
  }

  if (status === 'blocked') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(3,6,15,0.96)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
            <Icon name="lock" size={28} stroke={1.7} style={{ color: '#EF4444' }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 10 }}>
            {isEs ? 'Cuenta suspendida' : 'Account suspended'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.7, marginBottom: 28 }}>
            {isEs
              ? 'Tu acceso ha sido suspendido. Contacta con soporte para resolver tu situación.'
              : 'Your access has been suspended. Contact support to resolve your situation.'}
          </p>
          <a href="mailto:stevengalocr@gmail.com" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 12, background: 'var(--gradient-hero)', color: '#0A0F1C', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            stevengalocr@gmail.com
          </a>
        </div>
      </div>
    );
  }

  return null;
}
