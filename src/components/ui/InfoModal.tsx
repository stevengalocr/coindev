'use client';

import { useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';

interface InfoItem {
  icon: string;
  text_es: string;
  text_en: string;
}

interface Props {
  open: boolean;
  title_es: string;
  title_en: string;
  items: InfoItem[];
  onClose: () => void;
  lang?: string;
}

export function InfoModal({ open, title_es, title_en, items, onClose, lang = 'es' }: Props) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(4px)', cursor: 'pointer' }} />
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '24px 24px 20px',
        width: '100%', maxWidth: 400,
        boxShadow: 'var(--shadow-pop)',
        animation: 'confirm-in 200ms cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'color-mix(in oklab, var(--blue) 14%, var(--surface-2))', display: 'grid', placeItems: 'center', color: 'var(--blue)', flexShrink: 0 }}>
            <Icon name="info" size={20} stroke={1.8} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {lang === 'es' ? title_es : title_en}
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', color: 'var(--text-3)', padding: 4, flexShrink: 0 }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-3)', flexShrink: 0, marginTop: 1 }}>
                <Icon name={item.icon} size={15} stroke={1.7} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, margin: 0, paddingTop: 6 }}>
                {lang === 'es' ? item.text_es : item.text_en}
              </p>
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '11px 16px', borderRadius: 12,
            background: 'color-mix(in oklab, var(--blue) 12%, var(--surface-2))',
            border: '1px solid color-mix(in oklab, var(--blue) 25%, var(--border))',
            fontSize: 13.5, fontWeight: 600,
            color: 'var(--blue)',
          }}
        >
          {lang === 'es' ? 'Entendido' : 'Got it'}
        </button>
      </div>
      <style>{`@keyframes confirm-in { from { transform: scale(0.95); opacity:0 } to { transform: scale(1); opacity:1 } }`}</style>
    </div>
  );
}
