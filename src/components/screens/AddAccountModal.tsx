'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';

const COLORS = ['#5B9BFF','#4FE0A9','#9F7BFF','#FF8BB5','#F2C94C','#5BE5D1','#FF6B83','#FF9F43'];

const ACCOUNT_TYPES = [
  { id: 'checking',    icon: 'bank',   label_es: 'Cuenta bancaria', label_en: 'Bank account' },
  { id: 'savings',     icon: 'piggy',  label_es: 'Ahorros',         label_en: 'Savings'      },
  { id: 'cash',        icon: 'cash',   label_es: 'Efectivo',        label_en: 'Cash'         },
  { id: 'credit_card', icon: 'card',   label_es: 'Tarjeta crédito', label_en: 'Credit card'  },
] as const;

interface Props { open: boolean; onClose: () => void }

export function AddAccountModal({ open, onClose }: Props) {
  const { lang } = useApp();
  const { addAccount } = useData();

  const [type, setType] = useState<'checking'|'savings'|'cash'|'credit_card'>('checking');
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [creditLimit, setCreditLimit] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSave() {
    if (!name.trim()) { setError(lang === 'es' ? 'Escribe un nombre.' : 'Enter a name.'); return; }
    const bal = parseFloat(balance.replace(/,/g, '')) || 0;
    setSaving(true); setError('');
    try {
      await addAccount({
        name: name.trim(),
        type,
        initial_balance: bal,
        color,
        credit_limit: type === 'credit_card' && creditLimit ? parseFloat(creditLimit.replace(/,/g,'')) : undefined,
        last_digits: lastDigits.trim() || undefined,
      });
      onClose();
      setName(''); setBalance(''); setCreditLimit(''); setLastDigits('');
      setType('checking'); setColor(COLORS[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  const isCredit = type === 'credit_card';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
      <style>{`
        @keyframes cd-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .cd-modal-sheet { animation: cd-slide-up 260ms cubic-bezier(0.2,0.8,0.2,1); }
        @media (min-width: 640px) {
          .cd-modal-sheet { animation: none !important; }
        }
        .cd-sheet-inp {
          width: 100%; background: var(--surface-2); border: 1.5px solid var(--border);
          border-radius: var(--r-md); padding: 11px 14px; color: var(--text);
          font-size: 14px; font-family: var(--font-sans); outline: none;
          transition: border-color 150ms; box-sizing: border-box;
        }
        .cd-sheet-inp:focus { border-color: var(--blue); }
        .cd-sheet-inp::placeholder { color: var(--text-4); }
      `}</style>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(4px)' }} />
      <div className="cd-modal-sheet no-scrollbar" style={{
        position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto',
        background: 'var(--bg-2)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--border)', padding: '0 0 env(safe-area-inset-bottom,0)',
        maxHeight: '92vh', overflowY: 'auto',
      }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>

        <div style={{ padding: '16px 24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {lang === 'es' ? 'Nueva cuenta' : 'New account'}
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4 }}><Icon name="x" size={18} /></button>
          </div>

          {/* Tipo */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lang === 'es' ? 'Tipo de cuenta' : 'Account type'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ACCOUNT_TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  padding: '12px', borderRadius: 'var(--r-md)',
                  border: `1.5px solid ${type === t.id ? 'var(--blue)' : 'var(--border)'}`,
                  background: type === t.id ? 'color-mix(in oklab, var(--blue) 10%, var(--surface))' : 'var(--surface)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: type === t.id ? 'var(--text)' : 'var(--text-2)',
                  fontSize: 13, fontWeight: type === t.id ? 600 : 400,
                  transition: 'all 140ms',
                }}>
                  <Icon name={t.icon} size={16} stroke={1.7} style={{ color: type === t.id ? 'var(--blue)' : 'var(--text-3)' }} />
                  {lang === 'es' ? t.label_es : t.label_en}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <Field label={lang === 'es' ? 'Nombre' : 'Name'}>
            <input className="cd-sheet-inp" placeholder={lang === 'es' ? 'Ej: BAC Cuenta corriente' : 'e.g. Chase Checking'} value={name} onChange={e => setName(e.target.value)} />
          </Field>

          {/* Balance */}
          <Field label={lang === 'es' ? (isCredit ? 'Saldo actual (deuda)' : 'Saldo inicial') : (isCredit ? 'Current balance (debt)' : 'Initial balance')}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-3)', pointerEvents: 'none' }}>₡</span>
              <input className="cd-sheet-inp" style={{ paddingLeft: 28 }} placeholder="0" type="number" min="0" value={balance} onChange={e => setBalance(e.target.value)} />
            </div>
          </Field>

          {/* Crédito */}
          {isCredit && (
            <>
              <Field label={lang === 'es' ? 'Límite de crédito' : 'Credit limit'}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-3)', pointerEvents: 'none' }}>₡</span>
                  <input className="cd-sheet-inp" style={{ paddingLeft: 28 }} placeholder="0" type="number" min="0" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} />
                </div>
              </Field>
              <Field label={lang === 'es' ? 'Últimos 4 dígitos' : 'Last 4 digits'}>
                <input className="cd-sheet-inp" placeholder="1234" maxLength={4} value={lastDigits} onChange={e => setLastDigits(e.target.value.replace(/\D/g,''))} />
              </Field>
            </>
          )}

          {/* Color */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lang === 'es' ? 'Color' : 'Color'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 30, height: 30, borderRadius: '50%', background: c, border: 'none',
                  outline: color === c ? `3px solid ${c}` : 'none',
                  outlineOffset: 2, cursor: 'pointer', transition: 'transform 120ms',
                  transform: color === c ? 'scale(1.15)' : 'scale(1)',
                }} />
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: '9px 12px', borderRadius: 10, background: 'var(--expense-soft)', border: '1px solid rgba(255,107,131,0.2)', fontSize: 13, color: 'var(--expense)', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '14px', borderRadius: 'var(--r-md)',
            background: 'var(--gradient-hero)', color: '#0A0F1C',
            fontSize: 14, fontWeight: 700, border: 0, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, transition: 'opacity 150ms',
          }}>
            {saving ? (lang === 'es' ? 'Guardando…' : 'Saving…') : (lang === 'es' ? 'Crear cuenta' : 'Create account')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {children}
    </div>
  );
}
