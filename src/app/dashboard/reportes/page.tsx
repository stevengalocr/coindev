'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { MOVEMENTS, CAT, YEAR_EVOLUTION, filterMovs, fmtMoney, type Period } from '@/lib/data';
import { PeriodChips } from '@/components/shell/PeriodChips';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { Donut, YearChart } from '@/components/shell/Charts';
import { MoneyText } from '@/components/shell/MoneyText';

export default function ReportesPage() {
  const { t, currency, lang } = useApp();
  const [period, setPeriod] = useState<Period>('month');

  const movs = filterMovs(MOVEMENTS, period);
  const expensesByCat: Record<string, number> = {};
  movs.filter(m => m.type === 'expense').forEach(m => {
    expensesByCat[m.cat] = (expensesByCat[m.cat] || 0) + m.amount;
  });
  const donutData = Object.entries(expensesByCat)
    .map(([cat, value]) => ({ value, color: CAT[cat].color, cat }))
    .sort((a, b) => b.value - a.value);
  const totalExpenses = donutData.reduce((s, d) => s + d.value, 0);

  const byDesc: Record<string, number> = {};
  movs.filter(m => m.type === 'expense').forEach(m => {
    byDesc[m.desc] = (byDesc[m.desc] || 0) + m.amount;
  });
  const topMerchants = Object.entries(byDesc).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const income = movs.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
  const savings = income - totalExpenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  return (
    <div style={{ padding: '28px 32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            {t.reportsTitle}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>2026</div>
        </div>
        <PeriodChips value={period} onChange={setPeriod} t={t} />
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <SummaryCard
          label={t.income}
          amount={income}
          currency={currency}
          color="var(--income)"
          pct={null}
        />
        <SummaryCard
          label={t.expense}
          amount={totalExpenses}
          currency={currency}
          color="var(--expense)"
          pct={null}
        />
        <SummaryCard
          label={t.savings}
          amount={savings}
          currency={currency}
          color="var(--cyan)"
          pct={savingsRate}
        />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Donut */}
        <div className="cd-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>{t.distribution}</div>
          {donutData.length > 0 ? (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <Donut data={donutData} size={160} stroke={22} centerLabel={t.expense} centerValue={fmtMoney(totalExpenses, currency)} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {donutData.slice(0, 6).map(d => (
                  <div key={d.cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {CAT[d.cat][`label_${lang}` as 'label_es']}
                    </span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
                      {fmtMoney(d.value, currency)}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', width: 32, textAlign: 'right' }}>
                      {Math.round((d.value / totalExpenses) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
              {lang === 'es' ? 'Sin datos para este período.' : 'No data for this period.'}
            </div>
          )}
        </div>

        {/* Top merchants */}
        <div className="cd-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>{t.topMerchants}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {topMerchants.map(([desc, amt], i) => (
              <div key={desc} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
                borderBottom: i < topMerchants.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)',
                  display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600,
                  color: 'var(--text-3)',
                }} className="mono">
                  {i + 1}
                </div>
                <div style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {desc}
                </div>
                <MoneyText amount={amt} currency={currency} size={13} weight={600} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Year evolution */}
      <div className="cd-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{t.evolution}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>2026</div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: 'var(--income)' }} />
              {t.income}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: 'var(--expense)' }} />
              {t.expense}
            </span>
          </div>
        </div>
        <YearChart data={YEAR_EVOLUTION} currency={currency} big />
      </div>
    </div>
  );
}

function SummaryCard({ label, amount, currency, color, pct }: {
  label: string; amount: number; currency: string; color: string; pct: number | null;
}) {
  return (
    <div className="cd-card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 10 }}>
        {label}
      </div>
      <MoneyText amount={Math.abs(amount)} currency={currency as any} size={22} weight={600} style={{ color }} />
      {pct !== null && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
          <span style={{ color: pct >= 20 ? 'var(--income)' : pct >= 10 ? 'var(--warn)' : 'var(--expense)', fontWeight: 600 }}>
            {Math.round(pct)}%
          </span>
          {' '}{currency === 'CRC' ? 'tasa de ahorro' : 'savings rate'}
        </div>
      )}
    </div>
  );
}
