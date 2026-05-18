'use client';

import { useApp } from '@/hooks/useApp';
import { MOVEMENTS, CAT, fmtMoney } from '@/lib/data';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { Icon } from '@/components/ui/Icon';

export default function GastosFijosPage() {
  const { t, currency, lang } = useApp();

  const fixedMovs = MOVEMENTS.filter(m => m.type === 'expense' && m.fixed);
  const map: Record<string, typeof MOVEMENTS[0]> = {};
  fixedMovs.forEach(m => { if (!map[m.desc]) map[m.desc] = m; });
  const items = Object.values(map).sort((a, b) => b.amount - a.amount);

  const total = items.reduce((s, m) => s + m.amount, 0);
  const income = MOVEMENTS.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
  const ratio = total / income;
  const perDay = total / 30;

  const today = new Date(2026, 4, 18);

  const ratioColor = ratio > 0.6 ? 'var(--expense)' : ratio > 0.45 ? 'var(--warn)' : 'var(--income)';

  return (
    <div style={{ padding: '28px 32px 40px', maxWidth: 760 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
          {t.fixedTitle}
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{t.fixedSubtitle}</div>
      </div>

      {/* Hero summary card */}
      <div className="cd-card" style={{ padding: '22px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 100% 0%, color-mix(in oklab, var(--violet) 22%, transparent), transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>
            {t.monthly}
          </div>
          <MoneyText amount={total} currency={currency} size={36} weight={600} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
            <MetricTile
              label={t.perDay}
              value={<span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{fmtMoney(perDay, currency)}</span>}
            />
            <MetricTile
              label={t.ofIncome}
              value={<span className="mono" style={{ fontSize: 18, fontWeight: 700, color: ratioColor }}>{Math.round(ratio * 100)}%</span>}
            />
            <MetricTile
              label={lang === 'es' ? 'Compromisos' : 'Commitments'}
              value={<span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{items.length}</span>}
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(m => {
          const c = CAT[m.cat];
          const nextDay = new Date(2026, 5, m.date.getDate());
          const dailyAmt = m.amount / 30;

          return (
            <div
              key={m.id}
              className="cd-card"
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <CategoryGlyph id={m.cat} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{m.desc}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>
                  {c?.[`label_${lang}` as 'label_es']} · {t.nextDue}{' '}
                  <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>
                    {nextDay.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <MoneyText amount={m.amount} currency={currency} size={15} weight={600} />
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                  {fmtMoney(dailyAmt, currency)}/d
                </div>
              </div>
              <button style={{ color: 'var(--text-3)', marginLeft: 4, padding: 6 }}>
                <Icon name="more" size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{label}</div>
      {value}
    </div>
  );
}
