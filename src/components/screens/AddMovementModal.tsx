'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { CATEGORIES, ACCOUNTS } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddMovementModal({ open, onClose }: Props) {
  const { t, currency, lang } = useApp();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('food');
  const [acc, setAcc] = useState('bac');
  const [desc, setDesc] = useState('');
  const [fixed, setFixed] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount(''); setDesc(''); setFixed(false); setCat('food'); setType('expense');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const cats = CATEGORIES.filter(c =>
    type === 'income' ? ['salary', 'freelance'].includes(c.id) : !['salary', 'freelance'].includes(c.id)
  );
  const symbol = currency === 'USD' ? '$' : '₡';

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(3,6,15,0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 520,
        background: 'var(--surface)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)',
        borderBottom: 0,
        boxShadow: 'var(--shadow-pop)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
        className="no-scrollbar"
      >
        {/* Handle */}
        <div style={{ display: 'grid', placeItems: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>

        <div style={{ padding: '8px 24px 32px' }}>
          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={onClose} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', padding: '4px 0' }}>
              {t.cancel}
            </button>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{t.newMovement}</div>
            <div style={{ width: 60 }} />
          </div>

          {/* Type toggle */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
            background: 'var(--surface-2)', borderRadius: 14, padding: 4,
            marginBottom: 20, border: '1px solid var(--border)',
          }}>
            {([
              { id: 'expense', label: t.expenseType, color: 'var(--expense)' },
              { id: 'income', label: t.incomeType, color: 'var(--income)' },
            ] as const).map(opt => (
              <button
                key={opt.id}
                onClick={() => { setType(opt.id); setCat(opt.id === 'income' ? 'salary' : 'food'); }}
                style={{
                  padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  color: type === opt.id ? '#0A0F1C' : 'var(--text-2)',
                  background: type === opt.id ? opt.color : 'transparent',
                  transition: 'all 150ms',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Amount display */}
          <div style={{ textAlign: 'center', padding: '4px 0 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
              {t.amount}
            </div>
            <div className="mono" style={{ marginTop: 6, fontSize: 48, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text)' }}>
              <span style={{ color: 'var(--text-3)' }}>{symbol}</span>
              <span>{amount || '0'}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>{currency}</div>
          </div>

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 20 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(k => (
              <button
                key={k}
                onClick={() => {
                  if (k === '⌫') setAmount(a => a.slice(0, -1));
                  else if (k === '.' && amount.includes('.')) return;
                  else setAmount(a => (a + k).slice(0, 12));
                }}
                style={{
                  padding: '14px 0', borderRadius: 12,
                  background: k === '⌫' ? 'var(--surface-3)' : 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 19, fontWeight: 500,
                  fontFamily: 'var(--font-mono)',
                  transition: 'background 80ms',
                }}
                onMouseDown={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                onMouseUp={e => (e.currentTarget.style.background = k === '⌫' ? 'var(--surface-3)' : 'var(--surface-2)')}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Category picker */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>
              {t.category}
            </div>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
              {cats.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                    borderRadius: 999, whiteSpace: 'nowrap',
                    background: cat === c.id ? `color-mix(in oklab, ${c.color} 22%, transparent)` : 'var(--surface-2)',
                    border: `1px solid ${cat === c.id ? c.color : 'var(--border)'}`,
                    color: cat === c.id ? c.color : 'var(--text-2)',
                    fontSize: 12.5, fontWeight: 500,
                  }}
                >
                  <Icon name={c.glyph} size={13} stroke={1.8} />
                  {c[`label_${lang}` as 'label_es']}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="cd-card" style={{ padding: '2px 16px', marginBottom: 16 }}>
            <FieldRow label={t.account}>
              <select
                value={acc}
                onChange={e => setAcc(e.target.value)}
                style={{
                  background: 'transparent', border: 0, color: 'var(--text)',
                  fontSize: 13.5, fontWeight: 500, textAlign: 'right',
                  appearance: 'none', outline: 'none', fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                }}
              >
                {ACCOUNTS.map(a => <option key={a.id} value={a.id} style={{ background: '#10141F' }}>{a.name}</option>)}
              </select>
              <Icon name="chevron-down" size={14} style={{ color: 'var(--text-3)' }} />
            </FieldRow>
            <div className="cd-divider" />
            <FieldRow label={t.date}>
              <span style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500 }}>{t.today}</span>
              <Icon name="chevron-right" size={14} style={{ color: 'var(--text-3)' }} />
            </FieldRow>
            <div className="cd-divider" />
            <FieldRow label={t.description}>
              <input
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder={t.descriptionHint}
                style={{
                  flex: 1, background: 'transparent', border: 0, outline: 'none',
                  color: 'var(--text)', fontSize: 13.5, fontWeight: 500,
                  textAlign: 'right', fontFamily: 'var(--font-sans)',
                }}
              />
            </FieldRow>
            <div className="cd-divider" />
            <FieldRow label={t.recurring}>
              <Toggle on={fixed} onClick={() => setFixed(!fixed)} />
            </FieldRow>
          </div>

          {/* Save button */}
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '15px 18px', borderRadius: 14,
              background: 'var(--gradient-hero)', color: '#0A0F1C',
              fontSize: 15, fontWeight: 600, letterSpacing: '0.01em',
              opacity: !amount || amount === '0' ? 0.5 : 1,
              transition: 'opacity 150ms',
            }}
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', minHeight: 46 }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, width: 90, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 46, height: 27, borderRadius: 14, position: 'relative',
        background: on ? 'var(--income)' : 'var(--surface-3)',
        transition: 'background 150ms', border: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3.5, left: on ? 23 : 3.5,
        width: 20, height: 20, borderRadius: 10,
        background: on ? '#0A0F1C' : 'var(--text-3)',
        transition: 'left 180ms cubic-bezier(0.2,0.7,0.2,1)',
        display: 'block',
      }} />
    </button>
  );
}
