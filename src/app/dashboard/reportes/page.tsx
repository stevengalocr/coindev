'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { CAT, filterMovs, fmtMoney, aggregate, type Period } from '@/lib/data';
import { PeriodChips } from '@/components/shell/PeriodChips';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { Donut, YearChart } from '@/components/shell/Charts';
import { MoneyText } from '@/components/shell/MoneyText';

export default function ReportesPage() {
  const { t, currency, lang } = useApp();
  const { movements, accounts, yearEvolution, loading } = useData();
  const [period, setPeriod] = useState<Period>('month');

  const movs = filterMovs(movements, period);
  const expByCat: Record<string, number> = {};
  movs.filter(m => m.type === 'expense').forEach(m => { expByCat[m.cat] = (expByCat[m.cat] || 0) + m.amount; });
  const donutData = Object.entries(expByCat)
    .map(([cat, value]) => ({ value, color: CAT[cat]?.color ?? '#888', cat }))
    .sort((a, b) => b.value - a.value);
  const totalExp = donutData.reduce((s, d) => s + d.value, 0);

  const byDesc: Record<string, number> = {};
  movs.filter(m => m.type === 'expense').forEach(m => { byDesc[m.desc] = (byDesc[m.desc] || 0) + m.amount; });
  const topMerchants = Object.entries(byDesc).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const income = movs.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
  const savings = income - totalExp;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  // Financial health metrics
  const savingsBalance = accounts.find(a => a.kind === 'savings')?.balance ?? 0;
  const health = aggregate(movs, savingsBalance);
  const healthSavingsRate = health.savingsRate * 100;
  const healthFixedRatio = health.fixedRatio * 100;
  const healthEmergencyDays = health.emergencyDays;

  const now = new Date();
  const yearLabel = now.getFullYear().toString();

  return (
    <div>
      <style>{`
        @media (max-width: 640px) {
          .rep-summary { grid-template-columns: 1fr !important; }
          .rep-grid { grid-template-columns: 1fr !important; }
          .rep-health { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .rep-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>{t.reportsTitle}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{yearLabel}</div>
        </div>
        <PeriodChips value={period} onChange={setPeriod} t={t} />
      </div>

      {/* ── Financial Health ──────────────────────────────────────── */}
      {!loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>{t.healthTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="rep-health">
            {/* Savings rate */}
            <div className="cd-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 8 }}>
                {t.savingsRateLabel}
              </div>
              <div className="mono" style={{
                fontSize: 28, fontWeight: 700, lineHeight: 1,
                color: healthSavingsRate >= 20 ? 'var(--income)' : healthSavingsRate >= 10 ? 'var(--warn)' : 'var(--expense)',
              }}>
                {Math.round(healthSavingsRate)}%
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>
                {lang === 'es' ? 'Ahorro sobre ingresos' : 'Savings over income'}
              </div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.min(100, Math.max(0, healthSavingsRate))}%`,
                  background: healthSavingsRate >= 20 ? 'var(--income)' : healthSavingsRate >= 10 ? 'var(--warn)' : 'var(--expense)',
                  transition: 'width 600ms ease',
                }} />
              </div>
            </div>

            {/* Fixed / Income ratio */}
            <div className="cd-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 8 }}>
                {t.fixedRatioLabel}
              </div>
              <div className="mono" style={{
                fontSize: 28, fontWeight: 700, lineHeight: 1,
                color: healthFixedRatio < 40 ? 'var(--income)' : healthFixedRatio < 60 ? 'var(--warn)' : 'var(--expense)',
              }}>
                {Math.round(healthFixedRatio)}%
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>
                {lang === 'es' ? 'Compromisos mensuales' : 'Monthly commitments'}
              </div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.min(100, Math.max(0, healthFixedRatio))}%`,
                  background: healthFixedRatio < 40 ? 'var(--income)' : healthFixedRatio < 60 ? 'var(--warn)' : 'var(--expense)',
                  transition: 'width 600ms ease',
                }} />
              </div>
            </div>

            {/* Emergency days */}
            <div className="cd-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 8 }}>
                {t.emergencyDaysLabel}
              </div>
              <div className="mono" style={{
                fontSize: 28, fontWeight: 700, lineHeight: 1,
                color: healthEmergencyDays >= 90 ? 'var(--income)' : healthEmergencyDays >= 30 ? 'var(--warn)' : 'var(--expense)',
              }}>
                {healthEmergencyDays}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>
                {lang === 'es' ? 'Con gastos actuales' : 'At current spend'}
              </div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.min(100, (healthEmergencyDays / 180) * 100)}%`,
                  background: healthEmergencyDays >= 90 ? 'var(--income)' : healthEmergencyDays >= 30 ? 'var(--warn)' : 'var(--expense)',
                  transition: 'width 600ms ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>Cargando…</div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }} className="rep-summary">
            {[
              { label: t.income, amount: income, color: 'var(--income)', pct: null },
              { label: t.expense, amount: totalExp, color: 'var(--expense)', pct: null },
              { label: t.savings, amount: savings, color: 'var(--cyan)', pct: savingsRate },
            ].map(({ label, amount, color, pct }) => (
              <div key={label} className="cd-card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 10 }}>{label}</div>
                <MoneyText amount={Math.abs(amount)} currency={currency} size={22} weight={600} style={{ color }} />
                {pct !== null && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
                    <span style={{ color: pct >= 20 ? 'var(--income)' : pct >= 10 ? 'var(--warn)' : 'var(--expense)', fontWeight: 600 }}>
                      {Math.round(pct)}%
                    </span>{' '}
                    {lang === 'es' ? 'tasa de ahorro' : 'savings rate'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="rep-grid">
            <div className="cd-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>{t.distribution}</div>
              {donutData.length > 0 ? (
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Donut data={donutData} size={160} stroke={22} centerLabel={t.expense} centerValue={fmtMoney(totalExp, currency)} />
                  <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {donutData.slice(0, 6).map(d => (
                      <div key={d.cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CategoryGlyph id={d.cat} size={22} />
                        <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {CAT[d.cat]?.[`label_${lang}` as 'label_es'] ?? d.cat}
                        </span>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{fmtMoney(d.value, currency)}</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', width: 32, textAlign: 'right' }}>
                          {Math.round((d.value / totalExp) * 100)}%
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

            <div className="cd-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>{t.topMerchants}</div>
              {topMerchants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
                  {lang === 'es' ? 'Sin datos.' : 'No data.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {topMerchants.map(([desc, amt], i) => (
                    <div key={desc} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < topMerchants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }} className="mono">{i + 1}</div>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</div>
                      <MoneyText amount={amt} currency={currency} size={13} weight={600} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="cd-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{t.evolution}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{yearLabel}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                {[{ c: 'var(--income)', l: t.income }, { c: 'var(--expense)', l: t.expense }].map(({ c, l }) => (
                  <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                    <span style={{ width: 9, height: 9, borderRadius: 5, background: c }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <YearChart data={yearEvolution} currency={currency} big />
          </div>
        </>
      )}

    </div>
  );
}
