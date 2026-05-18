'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { MOVEMENTS, CAT, ACCOUNTS, filterMovs, fmtMoney, type Period, type Movement } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { PeriodChips } from '@/components/shell/PeriodChips';
import { AddMovementModal } from '@/components/screens/AddMovementModal';

export default function MovimientosPage() {
  const { t, currency, lang } = useApp();
  const [period, setPeriod] = useState<Period>('month');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const list = filterMovs(MOVEMENTS, period).filter(m => {
    if (filter !== 'all' && m.type !== filter) return false;
    if (query && !m.desc.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const groups: Record<string, Movement[]> = {};
  list.forEach(m => {
    const k = m.date.toDateString();
    (groups[k] = groups[k] || []).push(m);
  });

  const total = list.reduce((s, m) => s + (m.type === 'expense' ? -m.amount : m.amount), 0);
  const today = new Date(2026, 4, 18);

  function dayLabel(dateStr: string) {
    const date = new Date(dateStr);
    const diff = Math.floor((today.getTime() - date.getTime()) / 86400000);
    if (diff === 0) return t.today;
    if (diff === 1) return t.yesterday;
    return date.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  return (
    <>
      <div style={{ padding: '28px 32px 40px', maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
              {t.movements}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
              {list.length} {t.transactions} · <span className="mono">{fmtMoney(total, currency, { sign: true })}</span>
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            style={{
              padding: '9px 16px 9px 12px', borderRadius: 10, background: 'var(--gradient-hero)',
              color: '#0A0F1C', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <Icon name="plus" size={15} stroke={2.4} /> {t.newMovement}
          </button>
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', flex: 1, minWidth: 200, maxWidth: 360,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          }}>
            <Icon name="search" size={15} style={{ color: 'var(--text-3)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.searchMov}
              style={{
                flex: 1, background: 'transparent', border: 0, outline: 'none',
                color: 'var(--text)', fontSize: 13.5,
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ color: 'var(--text-3)' }}>
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          <PeriodChips value={period} onChange={setPeriod} t={t} />

          {/* Type filter */}
          <div style={{
            display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 3,
          }}>
            {(['all', 'income', 'expense'] as const).map(k => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 12.5,
                  background: filter === k ? 'var(--surface-3)' : 'transparent',
                  color: filter === k ? 'var(--text)' : 'var(--text-3)',
                  fontWeight: 500, transition: 'all 120ms',
                }}
              >
                {k === 'all' ? t.all : k === 'income' ? t.income : t.expense}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {Object.entries(groups).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>
            {lang === 'es' ? 'No hay movimientos en este filtro.' : 'No transactions match.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(groups).map(([day, items]) => {
              const daySum = items.reduce((s, m) => s + (m.type === 'expense' ? -m.amount : m.amount), 0);
              return (
                <div key={day}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px 8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                      {dayLabel(day)}
                    </span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
                      {fmtMoney(daySum, currency, { sign: true })}
                    </span>
                  </div>
                  <div className="cd-card" style={{ padding: 4 }}>
                    {items.map((m, i) => (
                      <MovRow key={m.id} m={m} currency={currency} lang={lang} t={t} divider={i < items.length - 1} today={today} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddMovementModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function MovRow({ m, currency, lang, t, divider, today }: {
  m: Movement; currency: string; lang: string; t: typeof MOVEMENTS[0] extends any ? any : any;
  divider: boolean; today: Date;
}) {
  const c = CAT[m.cat];
  const acc = ACCOUNTS.find(a => a.id === m.account);
  const diff = Math.floor((today.getTime() - m.date.getTime()) / 86400000);
  const when = diff === 0 ? t.today : diff === 1 ? t.yesterday :
    m.date.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'short' });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px',
      borderBottom: divider ? '1px solid var(--border)' : 'none',
      cursor: 'pointer', borderRadius: 10, transition: 'background 100ms',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <CategoryGlyph id={m.cat} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.desc}
          </span>
          {m.fixed && <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--violet)', flexShrink: 0 }} />}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
          {c?.[`label_${lang}` as 'label_es']} · {acc?.name} · {when}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <MoneyText
          amount={m.amount}
          currency={currency as any}
          size={13.5}
          weight={600}
          sign
          type={m.type}
        />
      </div>
    </div>
  );
}
