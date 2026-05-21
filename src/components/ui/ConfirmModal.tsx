'use client';

import { useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  lang?: string;
}

export function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, loading, lang = 'es' }: Props) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '28px 24px 24px',
        width: '100%', maxWidth: 380,
        boxShadow: 'var(--shadow-pop)',
        animation: 'confirm-in 200ms cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--expense-soft)', display: 'grid', placeItems: 'center', color: 'var(--expense)', flexShrink: 0 }}>
            <Icon name="trash" size={20} stroke={1.7} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>{message}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px 16px', borderRadius: 11,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            fontSize: 13.5, fontWeight: 500, color: 'var(--text-2)',
          }}>
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: '10px 16px', borderRadius: 11,
            background: 'var(--expense-soft)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 13.5, fontWeight: 600, color: 'var(--expense)',
            opacity: loading ? 0.65 : 1, transition: 'opacity 150ms',
          }}>
            {loading ? (lang === 'es' ? 'Eliminando…' : 'Deleting…') : (confirmLabel ?? (lang === 'es' ? 'Eliminar' : 'Delete'))}
          </button>
        </div>
      </div>
      <style>{`@keyframes confirm-in { from { transform: scale(0.95); opacity:0 } to { transform: scale(1); opacity:1 } }`}</style>
    </div>
  );
}
