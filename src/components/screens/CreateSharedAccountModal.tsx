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
        style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', borderRadius: '20px 20px 0 0', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: 'color-mix(in oklab, var(--cyan) 14%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--cyan) 25%, var(--border))', display: 'grid', placeItems: 'center' }}>
              <Icon name="users" size={18} stroke={1.8} style={{ color: 'var(--cyan)' }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {lang === 'es' ? 'Nueva cuenta compartida' : 'New shared account'}
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 6, borderRadius: 8 }}>
            <Icon name="x" size={18} stroke={2} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }} className="no-scrollbar">
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              {lang === 'es' ? 'Nombre de la cuenta' : 'Account name'}
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder={lang === 'es' ? 'Ej: Ahorros para el viaje' : 'E.g. Travel savings'}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Currency */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              {lang === 'es' ? 'Moneda' : 'Currency'}
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 15, cursor: 'pointer' }}
            >
              {LATAM_CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {lang === 'es' ? c.name_es : c.name_en}</option>
              ))}
            </select>
          </div>

          {/* Invite email */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              {lang === 'es' ? 'Correo del otro usuario' : 'Other user\'s email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder={lang === 'es' ? 'correo@ejemplo.com' : 'email@example.com'}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              {lang === 'es'
                ? 'El usuario debe estar registrado en CoinDev para recibir la invitación.'
                : 'The user must be registered in CoinDev to receive the invitation.'}
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'color-mix(in oklab, var(--expense) 12%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--expense) 30%, var(--border))', color: 'var(--expense)', fontSize: 13, marginBottom: 4 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cd-modal-footer" style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={submit}
            disabled={saving}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: saving ? 'var(--surface-3)' : 'var(--gradient-hero)', color: saving ? 'var(--text-3)' : 'var(--btn-hero-text)', fontSize: 15, fontWeight: 700, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {saving ? (
              <><Icon name="spark" size={16} />{lang === 'es' ? 'Enviando…' : 'Sending…'}</>
            ) : (
              <><Icon name="send" size={16} />{lang === 'es' ? 'Crear y enviar invitación' : 'Create & send invitation'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
