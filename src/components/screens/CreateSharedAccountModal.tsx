'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { Icon } from '@/components/ui/Icon';
import { createSharedAccount } from '@/lib/db';
import { LATAM_CURRENCIES } from '@/lib/data';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSharedAccountModal({ open, onClose, onSuccess }: Props) {
  const { lang } = useApp();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('CRC');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) { setName(''); setCurrency('CRC'); setEmail(''); setError(''); setSaving(false); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  async function submit() {
    setError('');
    if (!name.trim()) { setError(lang === 'es' ? 'Ingresa un nombre para la cuenta' : 'Enter an account name'); return; }
    if (!email.trim() || !email.includes('@')) { setError(lang === 'es' ? 'Ingresa un correo válido' : 'Enter a valid email'); return; }
    setSaving(true);
    try {
      await createSharedAccount(name.trim(), currency, email.trim().toLowerCase());
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('user_not_found')) {
        setError(lang === 'es' ? 'No existe ningún usuario con ese correo' : 'No user found with that email');
      } else if (msg.includes('yourself')) {
        setError(lang === 'es' ? 'No puedes invitarte a ti mismo' : 'You cannot invite yourself');
      } else {
        setError(lang === 'es' ? 'Ocurrió un error. Intenta de nuevo.' : 'An error occurred. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="cd-modal-sheet"
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--surface)',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid var(--border)',
          // Single scrollable container — no sticky footer that hides behind keyboard
          overflowY: 'auto',
          maxHeight: '92dvh',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'color-mix(in oklab, var(--cyan) 14%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--cyan) 25%, var(--border))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="users" size={17} stroke={1.8} style={{ color: 'var(--cyan)' }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {lang === 'es' ? 'Nueva cuenta compartida' : 'New shared account'}
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 6, borderRadius: 8 }}>
            <Icon name="x" size={18} stroke={2} />
          </button>
        </div>

        {/* Fields — all in one scroll, no footer trap */}
        <div style={{ padding: '18px 20px' }}>

          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
              {lang === 'es' ? 'Nombre de la cuenta' : 'Account name'}
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={lang === 'es' ? 'Ej: Ahorros para el viaje' : 'E.g. Travel savings'}
              inputMode="text"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Currency */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
              {lang === 'es' ? 'Moneda' : 'Currency'}
            </div>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 16, cursor: 'pointer' }}
            >
              {LATAM_CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {lang === 'es' ? c.name_es : c.name_en}</option>
              ))}
            </select>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
              {lang === 'es' ? 'Correo del otro usuario' : "Other user's email"}
            </div>
            <input
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.4 }}>
              {lang === 'es'
                ? 'El usuario debe estar registrado en CoinDev.'
                : 'The user must be registered in CoinDev.'}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'color-mix(in oklab, var(--expense) 12%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--expense) 30%, var(--border))', color: 'var(--expense)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Submit — inline so it's never hidden behind keyboard */}
          <button
            onClick={submit}
            disabled={saving}
            style={{ width: '100%', marginTop: 20, padding: '15px', borderRadius: 14, background: saving ? 'var(--surface-3)' : 'var(--gradient-hero)', color: saving ? 'var(--text-3)' : 'var(--btn-hero-text)', fontSize: 15, fontWeight: 700, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {saving
              ? <><Icon name="spark" size={16} />{lang === 'es' ? 'Enviando…' : 'Sending…'}</>
              : <><Icon name="send" size={16} />{lang === 'es' ? 'Crear y enviar invitación' : 'Create & send invitation'}</>
            }
          </button>

          {/* Spacer: clears mobile floating nav (64px + 18px gap + safe area) */}
          <div className="modal-nav-spacer" />
        </div>
      </div>

      <style>{`
        .modal-nav-spacer { height: 8px; }
        @media (max-width: 768px) {
          .modal-nav-spacer { height: calc(96px + env(safe-area-inset-bottom, 0px)); }
        }
      `}</style>
    </div>
  );
}
