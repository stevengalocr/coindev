'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { useToast } from '@/components/ui/Toast';
import { Icon } from '@/components/ui/Icon';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { insertFixedConfirmation } from '@/lib/db';
import { type Movement } from '@/lib/data';

const DAYS_AHEAD = 5;

function getNextDueDate(m: Movement, today: Date): Date | null {
  if (!m.fixed || !m.recurrence) return null;
  const r = m.recurrence;

  if (r.type === 'monthly') {
    const thisMonthDue = new Date(today.getFullYear(), today.getMonth(), r.value);
    thisMonthDue.setHours(0, 0, 0, 0);
    if (thisMonthDue > today) return thisMonthDue;
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, r.value);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth;
  }

  if (r.type === 'weekly') {
    const todayDay = today.getDay() === 0 ? 7 : today.getDay();
    let daysUntil = r.value - todayDay;
    if (daysUntil <= 0) daysUntil += 7;
    const d = new Date(today);
    d.setDate(today.getDate() + daysUntil);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  return null;
}

function computePeriodKey(m: Movement, nextDue: Date): string {
  if (m.recurrence?.type === 'weekly') {
    const d = new Date(Date.UTC(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
  return `${nextDue.getFullYear()}-${String(nextDue.getMonth() + 1).padStart(2, '0')}`;
}

export function UpcomingFixedCard() {
  const { lang } = useApp();
  const { pendingMovements, fixedConfirmations, accounts, liveUsdRate, addTransaction } = useData();
  const toast = useToast();
  const [confirming, setConfirming] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcomingItems = useMemo(() => {
    return pendingMovements.filter(m => {
      if (!m.fixed || !m.recurrence) return false;

      const nextDue = getNextDueDate(m, today);
      if (!nextDue) return false;

      // Item must have started on or before the next due date
      const mStart = new Date(m.date);
      mStart.setHours(0, 0, 0, 0);
      if (mStart > nextDue) return false;

      // Only show items due in 1–5 days (tomorrow through DAYS_AHEAD)
      const daysUntil = Math.round((nextDue.getTime() - today.getTime()) / 86400000);
      if (daysUntil <= 0 || daysUntil > DAYS_AHEAD) return false;

      // Not already confirmed for that upcoming period
      const pKey = computePeriodKey(m, nextDue);
      return !fixedConfirmations.some(c => c.template_id === m.id && c.period_key === pKey);
    });
  }, [pendingMovements, fixedConfirmations, today]);

  if (upcomingItems.length === 0) return null;

  const accCurrencyMap = Object.fromEntries(accounts.map(a => [a.id, a.currency ?? 'CRC']));
  const toCRC = (amount: number, cur: string) => cur === 'USD' ? amount * liveUsdRate : amount;

  const totalExpenses = upcomingItems
    .filter(m => m.type === 'expense')
    .reduce((s, m) => s + toCRC(m.amount, accCurrencyMap[m.account] ?? 'CRC'), 0);
  const totalIncome = upcomingItems
    .filter(m => m.type === 'income')
    .reduce((s, m) => s + toCRC(m.amount, accCurrencyMap[m.account] ?? 'CRC'), 0);

  async function confirmEarly(m: Movement) {
    setConfirming(m.id);
    try {
      const nextDue = getNextDueDate(m, today)!;
      const pKey = computePeriodKey(m, nextDue);

      // Register confirmation for the NEXT period first
      await insertFixedConfirmation(m.id, pKey);

      // Create confirmed transaction dated TODAY (actual payment date)
      await addTransaction({
        type: m.type,
        cat: m.cat,
        amount: m.amount,
        account_id: m.account,
        date: new Date().toISOString().split('T')[0],
        description: m.desc,
        is_fixed: false,
      });

      toast(
        m.type === 'income'
          ? (lang === 'es' ? `${m.desc} cobrado` : `${m.desc} received`)
          : (lang === 'es' ? `${m.desc} pagado` : `${m.desc} paid`),
        'success'
      );
    } finally {
      setConfirming(null);
    }
  }

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
        background: 'linear-gradient(135deg, color-mix(in oklab, var(--warn) 8%, var(--surface)) 0%, var(--surface) 100%)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'color-mix(in oklab, var(--warn) 14%, var(--surface-2))',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon name="cal" size={16} stroke={1.8} style={{ color: 'var(--warn)' }} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {lang === 'es' ? `Próximos ${DAYS_AHEAD} días` : `Next ${DAYS_AHEAD} days`}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>
              {totalIncome > 0 && (
                <span style={{ color: 'var(--income)', fontWeight: 600 }}>
                  {lang === 'es'
                    ? `+₡${Math.round(totalIncome).toLocaleString()} por cobrar`
                    : `+₡${Math.round(totalIncome).toLocaleString()} incoming`}
                </span>
              )}
              {totalIncome > 0 && totalExpenses > 0 && ' · '}
              {totalExpenses > 0 && (
                <span style={{ color: 'var(--expense)', fontWeight: 600 }}>
                  {lang === 'es'
                    ? `-₡${Math.round(totalExpenses).toLocaleString()} por pagar`
                    : `-₡${Math.round(totalExpenses).toLocaleString()} due`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        {upcomingItems.map((m, i) => {
          const nextDue = getNextDueDate(m, today)!;
          const daysUntil = Math.round((nextDue.getTime() - today.getTime()) / 86400000);
          const currency = accCurrencyMap[m.account] ?? 'CRC';
          const acc = accounts.find(a => a.id === m.account);
          const isIncome = m.type === 'income';
          const busy = confirming === m.id;

          const dueLabel = daysUntil === 1
            ? (lang === 'es' ? 'Mañana' : 'Tomorrow')
            : lang === 'es' ? `En ${daysUntil} días` : `In ${daysUntil} days`;

          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 18px',
              borderBottom: i < upcomingItems.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <CategoryGlyph id={m.cat} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13.5, fontWeight: 600, color: 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {m.desc}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                  {acc?.name ?? '—'} ·{' '}
                  <span style={{ color: 'var(--warn)', fontWeight: 600 }}>{dueLabel}</span>
                </div>
              </div>
              <MoneyText
                amount={isIncome ? m.amount : -m.amount}
                currency={currency}
                size={14} weight={700} sign type={m.type}
                style={{ flexShrink: 0 }}
              />
              <button
                onClick={() => confirmEarly(m)}
                disabled={busy}
                style={{
                  height: 32, padding: '0 12px', borderRadius: 8,
                  background: isIncome
                    ? 'var(--income-soft)'
                    : 'color-mix(in oklab, var(--warn) 12%, var(--surface-2))',
                  border: `1px solid ${isIncome
                    ? 'color-mix(in oklab, var(--income) 30%, transparent)'
                    : 'color-mix(in oklab, var(--warn) 30%, var(--border))'}`,
                  color: isIncome ? 'var(--income)' : 'var(--warn)',
                  fontSize: 12, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
                  whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
                  opacity: busy ? 0.6 : 1, flexShrink: 0,
                }}
              >
                {busy
                  ? <Icon name="spark" size={13} />
                  : <Icon name="check" size={13} stroke={2.5} />}
                {busy
                  ? (lang === 'es' ? 'Guardando…' : 'Saving…')
                  : isIncome
                  ? (lang === 'es' ? 'Cobrar ahora' : 'Receive now')
                  : (lang === 'es' ? 'Pagar ahora' : 'Pay now')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
