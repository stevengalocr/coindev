'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { useToast } from '@/components/ui/Toast';
import { Icon } from '@/components/ui/Icon';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { insertFixedDueNotification, insertFixedConfirmation } from '@/lib/db';
import { type Movement } from '@/lib/data';

const NOTIF_KEY = 'cd_due_notified';
const STORAGE_KEY = 'cd_due_dismissed';

// Fix #2: period key helpers for DB storage (ISO week, not week-of-month)
function periodKey(recType: 'monthly' | 'weekly'): string {
  const today = new Date();
  if (recType === 'monthly') {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }
  // ISO week number
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getDismissedToday(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw);
    if (date !== new Date().toDateString()) return new Set();
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
  // Fix #2: fixedConfirmations comes from DB via useData (cross-device safe)
  const { pendingMovements, fixedConfirmations, accounts, liveUsdRate, addTransaction, confirmPending } = useData();
  const toast = useToast();

  const today = new Date();
  const dayOfMonth = today.getDate();
  // Fix #5: treat Sunday (getDay=0) as 7 so weekly overdue detection works correctly
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

  const [dismissed, setDismissed] = useState<Set<string>>(() => getDismissedToday());
  const [confirming, setConfirming] = useState<string | null>(null);

  // Fix #2: build confirmed sets from DB data (not localStorage)
  const monthlyKey = periodKey('monthly');
  const weeklyKey = periodKey('weekly');
  const confirmedMonthly = useMemo(
    () => new Set(fixedConfirmations.filter(c => c.period_key === monthlyKey).map(c => c.template_id)),
    [fixedConfirmations, monthlyKey]
  );
  const confirmedWeekly = useMemo(
    () => new Set(fixedConfirmations.filter(c => c.period_key === weeklyKey).map(c => c.template_id)),
    [fixedConfirmations, weeklyKey]
  );

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Fix #6: memoize dueItems to avoid re-reading confirmed sets on every render
  const dueItems = useMemo(() => pendingMovements.filter(m => {
    if (dismissed.has(m.id)) return false;
    if (m.fixed && m.recurrence) {
      const r = m.recurrence;
      if (r.type === 'monthly') {
        if (confirmedMonthly.has(m.id)) return false;
        // Don't show if the item's start month hasn't arrived yet
        const startMonth = new Date(m.date.getFullYear(), m.date.getMonth(), 1);
        if (startMonth > thisMonthStart) return false;
        return r.value <= dayOfMonth;
      }
      if (r.type === 'weekly') {
        if (confirmedWeekly.has(m.id)) return false;
        // Don't show if the item's start date is still in the future
        if (m.date > today) return false;
        // Fix #5: Sunday (now dayOfWeek=7) correctly shows all items with r.value 1-7
        return r.value <= dayOfWeek;
      }
      return false;
    }
    if (!m.fixed && m.status === 'pending') {
      return m.date <= today;
    }
    return false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [pendingMovements, dismissed, confirmedMonthly, confirmedWeekly, dayOfMonth, dayOfWeek, thisMonthStart]);

  // Fix #8: use stable item-id string as dep so notification re-fires when items change
  const dueItemIds = dueItems.map(m => m.id).join(',');
  useEffect(() => {
    if (dueItems.length === 0) return;
    try {
      const todayStr = new Date().toDateString();
      const stored = localStorage.getItem(NOTIF_KEY);
      // Guard: fire once per day per unique item set
      const guard = `${todayStr}:${dueItemIds}`;
      if (stored === guard) return;
      localStorage.setItem(NOTIF_KEY, guard);

      const title = lang === 'es'
        ? `Tienes ${dueItems.length} compromiso${dueItems.length > 1 ? 's' : ''} hoy`
        : `You have ${dueItems.length} commitment${dueItems.length > 1 ? 's' : ''} today`;
      const body = dueItems.map(m => m.desc).join(', ');

      insertFixedDueNotification(title, body).catch(() => {});

      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/logo-64.png' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(perm => {
            if (perm === 'granted') new Notification(title, { body, icon: '/logo-64.png' });
          });
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueItemIds, lang]);

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
    setConfirming(m.id);
    try {
      if (m.fixed) {
        // Fix #3: write period confirmation FIRST so load() (called by addTransaction) picks it up
        const pKey = periodKey(m.recurrence?.type === 'weekly' ? 'weekly' : 'monthly');
        await insertFixedConfirmation(m.id, pKey);
        await addTransaction({
          type: m.type,
          cat: m.cat,
          amount: m.amount,
          account_id: m.account,
          date: today.toISOString().split('T')[0],
          description: m.desc,
          is_fixed: false,
        });
      } else {
        // Non-fixed pending: confirm in place via atomic RPC (Fix #1)
        await confirmPending(m.id);
      }
      toast(
        m.type === 'income'
          ? (lang === 'es' ? `${m.desc} registrado` : `${m.desc} recorded`)
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
          const busy = confirming === m.id;

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
              <MoneyText amount={isIncome ? m.amount : -m.amount} currency={currency} size={14} weight={700} sign type={m.type} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => skip(m)}
                  disabled={busy}
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
                <button
                  onClick={() => confirm(m)}
                  disabled={busy}
                  style={{
                    height: 32, padding: '0 12px', borderRadius: 8,
                    background: isIncome ? 'var(--income-soft)' : 'color-mix(in oklab, var(--cyan) 12%, var(--surface-2))',
                    border: `1px solid ${isIncome ? 'color-mix(in oklab, var(--income) 30%, transparent)' : 'color-mix(in oklab, var(--cyan) 30%, var(--border))'}`,
                    color: isIncome ? 'var(--income)' : 'var(--cyan)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 5,
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  {busy
                    ? <Icon name="spark" size={13} />
                    : <Icon name="check" size={13} stroke={2.5} />}
                  {busy
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
