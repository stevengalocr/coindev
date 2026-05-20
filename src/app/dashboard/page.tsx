'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph, AccountGlyph } from '@/components/shell/CategoryGlyph';
import { PeriodChips } from '@/components/shell/PeriodChips';
import { Donut, YearChart, HeroSwoosh } from '@/components/shell/Charts';
import { CAT, filterMovs, aggregate, fmtMoney, type Period, type Account } from '@/lib/data';

function clamp(v: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
function pct(n: number, d: number) { return d ? Math.round((n / d) * 100) : 0; }

function Bar({ ratio, color = 'var(--gradient-hero)', height = 6 }: { ratio: number; color?: string; height?: number }) {
  return (
    <div style={{ height, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${clamp(ratio) * 100}%`, background: color, borderRadius: 99, transition: 'width 400ms' }} />
    </div>
  );
}

function DeltaBadge({ text, positive = true }: { text: string; positive?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px',
      borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: positive ? 'var(--income-soft)' : 'var(--expense-soft)',
      color: positive ? 'var(--income)' : 'var(--expense)',
    }}>
      <Icon name={positive ? 'arrow-up' : 'arrow-down'} size={10} stroke={2.5} />
      {text}
    </span>
  );
}

function SectionCard({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="cd-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { t, currency, lang } = useApp();
  const { movements, budgets, accounts, yearEvolution, loading } = useData();
  const [period, setPeriod] = useState<Period>('month');

  const now2 = new Date();
  const dateStr2 = now2.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateLabel = dateStr2.charAt(0).toUpperCase() + dateStr2.slice(1);

  const filtered = filterMovs(movements, period);
  const savingsAcc = accounts.find(a => a.kind === 'savings');
  const { income, expense, net } = aggregate(filtered, savingsAcc?.balance ?? 0);
  const savings = net;

  const byCat: Record<string, number> = {};
  if (!loading) filtered.filter(m => m.type === 'expense').forEach(m => { byCat[m.cat] = (byCat[m.cat] || 0) + m.amount; });
  const donutData = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([catId, value]) => ({ value, color: CAT[catId]?.color || '#888', cat: catId }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page header — always visible */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            {t.home}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="check" size={11} stroke={2} style={{ color: 'var(--income)', flexShrink: 0 }} />
            {dateLabel}
          </div>
        </div>
        <PeriodChips value={period} onChange={setPeriod} t={t} />
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: 'var(--text-3)', fontSize: 14 }}>
          {lang === 'es' ? 'Cargando datos…' : 'Loading data…'}
        </div>
      )}
      {!loading && (<>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 16 }} className="stats-grid">
        {/* Hero */}
        <div className="cd-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden', gridArea: 'hero' }}>
          <HeroSwoosh opacity={0.9} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
              {t.netBalance}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
              <MoneyText amount={net} currency={currency} size={36} weight={700} />
              <DeltaBadge text={`${pct(savings, income)}% ${t.ofIncome}`} positive={savings >= 0} />
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>{t.vsLastMonth}</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3 }}>{t.income}</div>
                <MoneyText amount={income} currency={currency} size={14} weight={600} type="income" />
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3 }}>{t.expense}</div>
                <MoneyText amount={expense} currency={currency} size={14} weight={600} type="expense" />
              </div>
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="cd-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--income-soft)', color: 'var(--income)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="arrow-down" size={18} stroke={1.8} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)' }}>{t.income}</span>
          </div>
          <MoneyText amount={income} currency={currency} size={24} weight={700} />
          <div style={{ marginTop: 8 }}><DeltaBadge text={`${filtered.filter(m => m.type === 'income').length} mov.`} positive /></div>
        </div>

        {/* Expense */}
        <div className="cd-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--expense-soft)', color: 'var(--expense)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="arrow-up" size={18} stroke={1.8} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)' }}>{t.expense}</span>
          </div>
          <MoneyText amount={expense} currency={currency} size={24} weight={700} />
          <div style={{ marginTop: 8 }}><DeltaBadge text={`${filtered.filter(m => m.type === 'expense').length} mov.`} positive={false} /></div>
        </div>

        {/* Savings */}
        <div className="cd-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(91,229,209,0.15)', color: 'var(--cyan)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="piggy" size={18} stroke={1.8} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)' }}>{t.savings}</span>
          </div>
          <MoneyText amount={savings} currency={currency} size={24} weight={700} />
          <div style={{ marginTop: 8 }}>
            <DeltaBadge text={`${pct(savings, income)}% ${t.ofIncome}`} positive={savings >= 0} />
          </div>
        </div>
      </div>

      {/* Year + Budgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems: 'start' }} className="body-row">
        <SectionCard
          title={lang === 'es' ? 'Evolución del año' : 'Year evolution'}
          right={
            <div style={{ display: 'flex', gap: 14 }}>
              {[{ c: 'var(--income)', l: t.income }, { c: 'var(--expense)', l: t.expense }].map(({ c, l }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{l}</span>
                </div>
              ))}
            </div>
          }
        >
          <YearChart data={yearEvolution} currency={currency} big />
        </SectionCard>

        <SectionCard title={t.budgetsTitle}>
          {budgets.length === 0 ? (
            <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              {lang === 'es' ? 'Sin presupuestos' : 'No budgets'}
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                {(() => {
                  const total = budgets.reduce((s, b) => s + b.spent, 0);
                  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: 'var(--text-2)' }}>
                        <span>{lang === 'es' ? 'Total gastado' : 'Total spent'}</span>
                        <span className="mono" style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
                          {fmtMoney(total, currency)} / {fmtMoney(totalLimit, currency)}
                        </span>
                      </div>
                      <Bar ratio={total / totalLimit} height={8} />
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                        {pct(total, totalLimit)}% {lang === 'es' ? 'del presupuesto' : 'of budget'}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {budgets.slice(0, 4).map(b => {
                  const cat = CAT[b.cat];
                  const ratio = clamp(b.spent / b.limit);
                  const color = cat?.color || 'var(--income)';
                  const label = lang === 'es' ? cat?.label_es : cat?.label_en;
                  return (
                    <div key={b.cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CategoryGlyph id={b.cat} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>{label}</span>
                          <span style={{ fontSize: 11.5, color: b.spent > b.limit ? 'var(--expense)' : 'var(--text-3)', fontWeight: b.spent > b.limit ? 600 : 400 }}>
                            {pct(b.spent, b.limit)}%
                          </span>
                        </div>
                        <Bar ratio={ratio} color={color} height={5} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Recent + Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'start' }} className="body-row">
        <SectionCard
          title={t.recent}
          right={
            <Link href="/dashboard/movimientos" style={{ fontSize: 12.5, color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              {t.seeAll} <Icon name="arrow-right" size={13} stroke={2} />
            </Link>
          }
        >
          {filtered.length === 0 ? (
            <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              {lang === 'es' ? 'Sin movimientos en este período' : 'No movements in this period'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.slice(0, 7).map((m, idx) => {
                const cat = CAT[m.cat];
                const acct = accounts.find(a => a.id === m.account);
                return (
                  <div key={m.id}>
                    {idx > 0 && <div style={{ height: 1, background: 'var(--border)' }} />}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: 12, padding: '11px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <CategoryGlyph id={m.cat} size={34} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.desc}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{lang === 'es' ? cat?.label_es : cat?.label_en}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{acct?.name.split(' ')[0]}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
                        {m.date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })}
                      </div>
                      <MoneyText amount={m.amount} currency={currency} size={13.5} weight={600} sign type={m.type} style={{ textAlign: 'right', whiteSpace: 'nowrap' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title={lang === 'es' ? 'Distribución por categoría' : 'Category breakdown'} right={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.thisMonth}</span>}>
          {donutData.length === 0 ? (
            <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              {lang === 'es' ? 'Sin gastos aún' : 'No expenses yet'}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ flexShrink: 0 }}>
                <Donut data={donutData} size={148} stroke={22} centerLabel={t.expense} centerValue={fmtMoney(donutData.reduce((s, d) => s + d.value, 0), currency)} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {donutData.map((d, i) => {
                  const cat = CAT[d.cat];
                  const total = donutData.reduce((s, x) => s + x.value, 0);
                  return (
                    <div key={d.cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat?.color || '#888', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lang === 'es' ? cat?.label_es : cat?.label_en}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>{Math.round(d.value / total * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Accounts */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>{t.accountsTitle}</div>
          <Link href="/dashboard/cuentas" style={{ fontSize: 12.5, color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
            {t.seeAll} <Icon name="arrow-right" size={13} stroke={2} />
          </Link>
        </div>
        {accounts.length === 0 ? (
          <div className="cd-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <Icon name="bank" size={36} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              {lang === 'es' ? 'Sin cuentas aún' : 'No accounts yet'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {lang === 'es' ? 'Agrega tu primera cuenta para comenzar a registrar movimientos.' : 'Add your first account to start tracking movements.'}
            </div>
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }} className="accounts-grid">
          {accounts.map(acc => {
            const isCredit = acc.kind === 'credit';
            const used = isCredit ? Math.abs(acc.balance) : 0;
            const usedRatio = isCredit && acc.limit ? clamp(used / acc.limit) : 0;
            const kindLabel: Record<string, string> = { bank: 'Banco', cash: 'Efectivo', savings: 'Ahorros', credit: 'Crédito' };
            return (
              <div key={acc.id} className="cd-card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in oklab, ${acc.color} 30%, transparent) 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  <AccountGlyph acc={acc} size={36} />
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 99, padding: '3px 9px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {kindLabel[acc.kind]}
                  </span>
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{acc.tail || kindLabel[acc.kind]}</div>
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <MoneyText amount={Math.abs(acc.balance)} currency={currency} size={22} weight={700} type={isCredit ? 'expense' : undefined} />
                  {isCredit && acc.limit && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.used}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{pct(used, acc.limit)}%</span>
                      </div>
                      <Bar ratio={usedRatio} color={acc.color} height={5} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      <style>{`
        .stats-grid {
          grid-template-areas: 'hero hero income expense savings' !important;
          grid-template-columns: 1.5fr 1fr 1fr 1fr !important;
        }
        .stats-grid > *:first-child { grid-area: hero; }
        @media (max-width: 1100px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
            grid-template-areas: 'hero hero' 'income expense' 'savings savings' !important;
          }
          .body-row { grid-template-columns: 1fr !important; }
          .accounts-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
            grid-template-areas: 'hero hero' 'income expense' 'savings savings' !important;
          }
          .accounts-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      </>)}
    </div>
  );
}
