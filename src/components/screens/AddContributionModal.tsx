'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';
import { fmtMoney, type SavingsGoal } from '@/lib/data';
import { AccountGlyph } from '@/components/shell/CategoryGlyph';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  goal: SavingsGoal | null;
}

export function AddContributionModal({ open, onClose, onSuccess, goal }: Props) {
  const { lang } = useApp();
  const { accounts, addContribution } = useData();
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const validAccounts = accounts.filter(a => a.kind !== 'credit');

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setNote('');
    setError('');
    setAccountId(validAccounts[0]?.id ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !goal) return null;

  const remaining = goal.target - goal.current;

  async function handleSave() {
    if (!goal) return;
    const amt = parseFloat(amount.replace(/,/g, ''));
    if (!amt || amt <= 0) {
      setError(lang === 'es' ? 'Ingresa un monto válido.' : 'Enter a valid amount.');
      return;
    }
    if (!accountId) {
      setError(lang === 'es' ? 'Selecciona una cuenta.' : 'Select an account.');
      return;
    }
    const acc = accounts.find(a => a.id === accountId);
    if (acc && amt > acc.balance) {
      setError(lang === 'es' ? 'Saldo insuficiente en esa cuenta.' : 'Insufficient balance in that account.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addContribution(goal.id, accountId, amt, note.trim() || undefined);
      onClose();
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto',
        background: 'var(--bg-2)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--border)',
        maxHeight: '88vh', overflowY: 'auto',
        animation: 'cd-slide-up 260ms cubic-bezier(0.2,0.8,0.2,1)',
      }} className="no-scrollbar">
        <style>{`@keyframes cd-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>
        <div style={{ padding: '16px 24px 32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {lang === 'es' ? 'Abonar a meta' : 'Add to goal'}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>
                {goal.name} · {lang === 'es' ? 'Pendiente:' : 'Remaining:'}{' '}
                <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{fmtMoney(Math.max(0, remaining), goal.currency ?? 'CRC')}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4 }}><Icon name="x" size={18} /></button>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lang === 'es' ? 'Monto del abono' : 'Deposit amount'}
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-3)', pointerEvents: 'none' }}>₡</span>
              <input
                style={{ width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', padding: '11px 14px 11px 28px', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                placeholder="0"
                type="number" min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Account selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lang === 'es' ? 'Cuenta de origen' : 'Source account'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {validAccounts.map(a => (
                <button key={a.id} onClick={() => setAccountId(a.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 'var(--r-md)',
                  border: `1.5px solid ${accountId === a.id ? 'var(--blue)' : 'var(--border)'}`,
                  background: accountId === a.id ? 'color-mix(in oklab, var(--blue) 8%, var(--surface))' : 'var(--surface)',
                  transition: 'all 140ms', cursor: 'pointer',
                }}>
                  <AccountGlyph acc={{ kind: a.kind, color: a.color }} size={32} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{fmtMoney(a.balance, a.currency ?? 'CRC')}</div>
                  </div>
                  {accountId === a.id && <Icon name="check" size={16} stroke={2.5} style={{ color: 'var(--blue)', flexShrink: 0 }} />}
                </button>
              ))}
              {validAccounts.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                  {lang === 'es' ? 'No hay cuentas disponibles.' : 'No accounts available.'}
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lang === 'es' ? 'Nota (opcional)' : 'Note (optional)'}
            </div>
            <input
              style={{ width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', padding: '11px 14px', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              placeholder={lang === 'es' ? 'Ej: Quincena de mayo…' : 'e.g. May paycheck…'}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {error && (
            <div style={{ padding: '9px 12px', borderRadius: 10, background: 'var(--expense-soft)', border: '1px solid rgba(255,107,131,0.2)', fontSize: 13, color: 'var(--expense)', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button onClick={handleSave} disabled={saving || validAccounts.length === 0} style={{
            width: '100%', padding: '14px', borderRadius: 'var(--r-md)',
            background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)',
            fontSize: 14, fontWeight: 700, border: 0, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? (lang === 'es' ? 'Guardando…' : 'Saving…') : (lang === 'es' ? 'Confirmar abono' : 'Confirm deposit')}
          </button>
        </div>
      </div>
    </div>
  );
}
