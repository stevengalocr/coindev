'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';
import { transactSharedAccount } from '@/lib/db';
import { fmtMoney } from '@/lib/data';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sharedAccountId: string;
  sharedAccountName: string;
  sharedBalance: number;
  sharedCurrency: string;
  defaultType?: 'deposit' | 'withdrawal';
}

export function SharedTransactionModal({
  open, onClose, onSuccess,
  sharedAccountId, sharedAccountName, sharedBalance, sharedCurrency,
  defaultType = 'deposit',
}: Props) {
  const { lang } = useApp();
  const { accounts, refetch } = useData();
  const [type, setType] = useState<'deposit' | 'withdrawal'>(defaultType);
  const [amountStr, setAmountStr] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Personal accounts (exclude credit cards for deposits; allow all for withdrawal target)
  const eligibleAccounts = accounts.filter(a => a.kind !== 'credit');

  useEffect(() => {
    if (!open) { setAmountStr(''); setDescription(''); setError(''); setSaving(false); setDate(new Date().toISOString().split('T')[0]); }
    else { setType(defaultType); }
  }, [open, defaultType]);

  useEffect(() => {
    if (eligibleAccounts.length > 0 && !accountId) {
      setAccountId(eligibleAccounts[0].id);
    }
  }, [eligibleAccounts, accountId]);

  function pad(val: string, key: string) {
    if (key === '⌫') return val.slice(0, -1);
    if (key === '.' && val.includes('.')) return val;
    if (key === '.' && val === '') return '0.';
    if (val === '0' && key !== '.') return key;
    if (val.includes('.') && val.split('.')[1].length >= 2) return val;
    return val + key;
  }

  const amount = parseFloat(amountStr) || 0;
  const selectedAcc = accounts.find(a => a.id === accountId);

  async function submit() {
    setError('');
    if (amount <= 0) { setError(lang === 'es' ? 'Ingresa un monto válido' : 'Enter a valid amount'); return; }
    if (!accountId) { setError(lang === 'es' ? 'Selecciona una cuenta' : 'Select an account'); return; }
    if (type === 'withdrawal' && amount > sharedBalance) {
      setError(lang === 'es' ? 'Saldo insuficiente en la cuenta compartida' : 'Insufficient shared account balance');
      return;
    }
    setSaving(true);
    try {
      await transactSharedAccount(sharedAccountId, accountId, type, amount, description.trim(), date);
      await refetch();
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('insufficient_balance')) {
        setError(lang === 'es' ? 'Saldo insuficiente en la cuenta compartida' : 'Insufficient shared account balance');
      } else {
        setError(lang === 'es' ? 'Ocurrió un error. Intenta de nuevo.' : 'An error occurred. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const isDeposit = type === 'deposit';
  const accentColor = isDeposit ? 'var(--income)' : 'var(--expense)';
  const accentSoft = isDeposit ? 'var(--income-soft)' : 'color-mix(in oklab, var(--expense) 12%, var(--surface-2))';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="cd-modal-sheet"
        style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', borderRadius: '20px 20px 0 0', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{sharedAccountName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {lang === 'es' ? 'Balance: ' : 'Balance: '}
              <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{fmtMoney(sharedBalance, sharedCurrency)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 6, borderRadius: 8 }}>
            <Icon name="x" size={18} stroke={2} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }} className="no-scrollbar">
          {/* Type toggle */}
          <div style={{ padding: '16px 24px 0' }}>
            <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 3, width: '100%' }}>
              {(['deposit', 'withdrawal'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                    background: type === t ? (t === 'deposit' ? 'var(--income-soft)' : 'color-mix(in oklab, var(--expense) 12%, var(--surface-2))') : 'transparent',
                    color: type === t ? (t === 'deposit' ? 'var(--income)' : 'var(--expense)') : 'var(--text-3)',
                    border: type === t ? `1px solid ${t === 'deposit' ? 'color-mix(in oklab, var(--income) 30%, transparent)' : 'color-mix(in oklab, var(--expense) 30%, var(--border))'}` : '1px solid transparent',
                    transition: 'all 140ms',
                  }}
                >
                  {t === 'deposit'
                    ? (lang === 'es' ? '↑ Depositar' : '↑ Deposit')
                    : (lang === 'es' ? '↓ Retirar' : '↓ Withdraw')}
                </button>
              ))}
            </div>
          </div>

          {/* Amount display */}
          <div style={{ padding: '16px 24px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: amount > 0 ? accentColor : 'var(--text-3)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-3)', alignSelf: 'flex-start', marginTop: 8 }}>{sharedCurrency}</span>
              <span>{amountStr || '0'}</span>
            </div>
            {isDeposit && selectedAcc && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                {lang === 'es' ? 'Desde: ' : 'From: '}
                <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{selectedAcc.name}</span>
                {' · '}{fmtMoney(selectedAcc.balance, selectedAcc.currency)}
              </div>
            )}
            {!isDeposit && selectedAcc && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                {lang === 'es' ? 'Hacia: ' : 'To: '}
                <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{selectedAcc.name}</span>
              </div>
            )}
          </div>

          {/* Keypad */}
          <div style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k => (
              <button
                key={k}
                onClick={() => setAmountStr(v => pad(v, k))}
                className="cd-keypad-btn"
                style={{ padding: '14px 0', borderRadius: 12, background: k === '⌫' ? 'var(--surface-2)' : 'var(--surface-3)', color: k === '⌫' ? 'var(--text-2)' : 'var(--text)', fontSize: k === '⌫' ? 18 : 20, fontWeight: 600, border: '1px solid var(--border)', letterSpacing: '-0.02em' }}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Account selector */}
          <div style={{ padding: '16px 24px 4px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              {isDeposit
                ? (lang === 'es' ? 'Cuenta origen' : 'Source account')
                : (lang === 'es' ? 'Cuenta destino' : 'Destination account')}
            </label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}
            >
              {eligibleAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} · {fmtMoney(a.balance, a.currency)}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ padding: '12px 24px 4px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              {lang === 'es' ? 'Descripción (opcional)' : 'Description (optional)'}
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isDeposit ? (lang === 'es' ? 'Ej: Aporte mensual' : 'E.g. Monthly contribution') : (lang === 'es' ? 'Ej: Gastos del viaje' : 'E.g. Trip expenses')}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Date */}
          <div style={{ padding: '12px 24px 4px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              {lang === 'es' ? 'Fecha' : 'Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ padding: '11px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
            />
          </div>

          {error && (
            <div style={{ margin: '12px 24px 0', padding: '10px 14px', borderRadius: 10, background: 'color-mix(in oklab, var(--expense) 12%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--expense) 30%, var(--border))', color: 'var(--expense)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ height: 16 }} />
        </div>

        {/* Footer */}
        <div className="cd-modal-footer" style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={submit}
            disabled={saving || amount <= 0}
            style={{ width: '100%', padding: '14px', borderRadius: 14, background: saving || amount <= 0 ? 'var(--surface-3)' : accentSoft, color: saving || amount <= 0 ? 'var(--text-3)' : accentColor, border: `1px solid ${saving || amount <= 0 ? 'var(--border)' : 'color-mix(in oklab, ' + accentColor + ' 35%, var(--border))'}`, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {saving
              ? <><Icon name="spark" size={16} />{lang === 'es' ? 'Guardando…' : 'Saving…'}</>
              : isDeposit
              ? <><Icon name="plus" size={16} stroke={2.5} />{lang === 'es' ? 'Depositar' : 'Deposit'}</>
              : <><Icon name="minus" size={16} stroke={2.5} />{lang === 'es' ? 'Retirar' : 'Withdraw'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
