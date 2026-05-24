'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { useToast } from '@/components/ui/Toast';
import { Icon } from '@/components/ui/Icon';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { type Movement } from '@/lib/data';

const STORAGE_KEY = 'cd_due_dismissed';

function getDismissedToday(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw);
    const today = new Date().toDateString();
    if (date !== today) return new Set();
    return new Set(ids as string[]);
  } catch { return new Set(); }
}

function dismissForToday(ids: string[]) {
  try {
    const existing = getDismissedToday();
    ids.forEach(id => existing.add(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: new Date().toDateString(),
      ids: Array.from(existing),
    }));
  } catch { /* ignore */ }
}

export function DueTodayCard() {
  const { lang } = useApp();
  const { movements, accounts, liveUsdRate, addTransaction, refetch } = useData();
  const toast = useToast();

  const today = new Date();
  const dayOfMonth = today.getDate();
  const dayOfWeek = today.getDay();

  const [dismissed, setDismissed] = useState<Set<string>>(() => getDismissedToday());
  const [confirming, setConfirming] = useState<string | null>(null);

  const dueItems = movements.filter(m => {
    if (!m.fixed || !m.recurrence) return false;
    if (dismissed.has(m.id)) return false;
    const r = m.recurrence;
    if (r.type === 'monthly' && r.value === dayOfMonth) return true;
    if (r.type === 'weekly' && r.value === dayOfWeek) return true;
    return false;
  });

  if (dueItems.length === 0) return null;

  function skip(m: Movement) {
    dismissForToday([m.id]);
    setDismissed(prev => { const next = new Set(prev); next.add(m.id); return next; });
  }

  function skipAll() {
    const ids = dueItems.map(m => m.id);
    dismissForToday(ids);
    setDismissed(prev => { const next = new Set(prev); ids.forEach(id => next.add(id)); return next; });
  }

  async function confirm(m: Movement) {
    const acc = accounts.find(a => a.id === m.account);
    if (!acc) return;
    setConfirming(m.id);
    try {
      await addTransaction({
        type: m.type,
        cat: m.cat,
        amount: m.amount,
        account_id: m.account,
        date: today.toISOString().split('T')[0],
        description: m.desc,
        is_fixed: false,
      });
      await refetch();
      toast(
        m.type === 'income'
          ? (lang === 'es' ? `+${m.desc} registrado` : `${m.desc} recorded`)
          : (lang === 'es' ? `${m.desc} marcado como pagado` : `${m.desc} marked as paid`),
        'success'
      );
      dismissForToday([m.id]);
      setDismissed(prev => { const next = new Set(prev); next.add(m.id); return next; });
    } finally {
      setConfirming(null);
    }
  }

  const expensesDue = dueItems.filter(m => m.type === 'expense');
  const incomesDue = dueItems.filter(m => m.type === 'income');
  const accCurrencyMap = Object.fromEntries(accounts.map(a => [a.id, a.currency ?? 'CRC']));
  const toCRC = (amount: number, cur: string) => cur === 'USD' ? amount * liveUsdRate : amount;

  const totalExpenses = expensesDue.reduce((s, m) => s + toCRC(m.amount, accCurrencyMap[m.account] ?? 'CRC'), 0);
  const totalIncome = incomesDue.reduce((s, m) => s + toCRC(m.amount, accCurrencyMap[m.account] ?? 'CRC'), 0);

  return (
    <div style={{
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      boxShadow: 'var(--shadow-card)',
      marginBottom: 4,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg, color-mix(in oklab, var(--cyan) 10%, var(--surface)) 0%, var(--surface) 100%)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'color-mix(in oklab, var(--cyan) 16%, var(--surface-2))',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon name="cal" size={16} stroke={1.8} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {lang === 'es' ? 'Compromisos de hoy' : "Today's commitments"}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>
              {today.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              {incomesDue.length > 0 && totalIncome > 0 && (
                <> · <span style={{ color: 'var(--income)', fontWeight: 600 }}>
                  {lang === 'es' ? `+₡${Math.round(totalIncome).toLocaleString()} por cobrar` : `+₡${Math.round(totalIncome).toLocaleString()} incoming`}
                </span></>
              )}
              {expensesDue.length > 0 && totalExpenses > 0 && (
                <> · <span style={{ color: 'var(--expense)', fontWeight: 600 }}>
                  {lang === 'es' ? `-₡${Math.round(totalExpenses).toLocaleString()} por pagar` : `-₡${Math.round(totalExpenses).toLocaleString()} due`}
                </span></>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={skipAll}
          style={{ fontSize: 11, color: 'var(--text-4)', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {lang === 'es' ? 'Saltar todo' : 'Skip all'}
        </button>
      </div>

      {/* Items */}
      <div>
        {dueItems.map((m, i) => {
          const currency = accCurrencyMap[m.account] ?? 'CRC';
          const acc = accounts.find(a => a.id === m.account);
          const isIncome = m.type === 'income';
          const loading = confirming === m.id;

          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 18px',
              borderBottom: i < dueItems.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <CategoryGlyph id={m.cat} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.desc}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                  {acc?.name ?? '—'}
                  {m.recurrence?.type === 'monthly' && (
                    <> · {lang === 'es' ? `día ${m.recurrence.value}` : `day ${m.recurrence.value}`}</>
                  )}
                </div>
              </div>
              <MoneyText amount={m.amount} currency={currency} size={14} weight={700} sign type={m.type} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {/* Skip */}
                <button
                  onClick={() => skip(m)}
                  disabled={loading}
                  title={lang === 'es' ? 'Saltar hoy' : 'Skip today'}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--surface-2)',
                    display: 'grid', placeItems: 'center', cursor: 'pointer',
                    color: 'var(--text-3)',
                  }}
                >
                  <Icon name="x" size={14} stroke={2} />
                </button>
                {/* Confirm */}
                <button
                  onClick={() => confirm(m)}
                  disabled={loading}
                  style={{
                    height: 32, padding: '0 12px', borderRadius: 8,
                    background: isIncome ? 'var(--income-soft)' : 'color-mix(in oklab, var(--cyan) 12%, var(--surface-2))',
                    border: `1px solid ${isIncome ? 'color-mix(in oklab, var(--income) 30%, transparent)' : 'color-mix(in oklab, var(--cyan) 30%, var(--border))'}`,
                    color: isIncome ? 'var(--income)' : 'var(--cyan)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 5,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading
                    ? <Icon name="spark" size={13} />
                    : <Icon name="check" size={13} stroke={2.5} />}
                  {loading
                    ? (lang === 'es' ? 'Guardando…' : 'Saving…')
                    : isIncome
                    ? (lang === 'es' ? 'Recibido' : 'Received')
                    : (lang === 'es' ? 'Pagado' : 'Paid')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
