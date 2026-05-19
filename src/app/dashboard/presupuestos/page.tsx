'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { CAT, fmtMoney } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { AddBudgetModal } from '@/components/screens/AddBudgetModal';

export default function PresupuestosPage() {
  const { t, currency, lang } = useApp();
  const { budgets, loading } = useData();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  const now = new Date();
  const monthLabel = now.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { month: 'long', year: 'numeric' });
  const monthCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <div style={{ maxWidth: 840 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>{t.budgetsTitle}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{monthCap}</div>
        </div>
        <button onClick={() => setAddOpen(true)} style={{ padding: '9px 16px 9px 12px', borderRadius: 10, background: 'var(--gradient-hero)', color: '#0A0F1C', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="plus" size={15} stroke={2.4} /> {lang === 'es' ? 'Nuevo presupuesto' : 'New budget'}
        </button>
        <AddBudgetModal open={addOpen} onClose={() => setAddOpen(false)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>Cargando…</div>
      ) : budgets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>
          {lang === 'es' ? 'Aún no tienes presupuestos.' : 'No budgets yet.'}
        </div>
      ) : (
        <>
          <div className="cd-card" style={{ padding: '22px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 0% 50%, color-mix(in oklab, var(--cyan) 8%, transparent), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>
                  {t.spent} · {t.thisMonth}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <MoneyText amount={totalSpent} currency={currency} size={30} weight={600} />
                  <span className="mono" style={{ fontSize: 14, color: 'var(--text-3)' }}>{t.of} {fmtMoney(totalLimit, currency)}</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-3)' }}>
                  <span>{Math.round(overallPct)}% {lang === 'es' ? 'utilizado' : 'used'}</span>
                  <span>{fmtMoney(totalLimit - totalSpent, currency)} {t.left}</span>
                </div>
                <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(overallPct, 100)}%`, height: '100%', background: 'var(--gradient-hero)', transition: 'width 600ms' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {budgets.map(b => {
              const c = CAT[b.cat];
              const pct = Math.min((b.spent / b.limit) * 100, 100);
              const over = b.spent > b.limit;
              const danger = pct > 85;
              const barColor = over ? 'var(--expense)' : danger ? 'var(--warn)' : (c?.color ?? 'var(--income)');
              return (
                <div key={b.cat} className="cd-card"
                  style={{ padding: '18px 20px', cursor: 'pointer', transition: 'border-color 150ms', borderColor: hoverId === b.cat ? 'var(--border-strong)' : 'var(--border)' }}
                  onMouseEnter={() => setHoverId(b.cat)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <CategoryGlyph id={b.cat} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                        <span style={{ fontSize: 14.5, color: 'var(--text)', fontWeight: 600 }}>
                          {c?.[`label_${lang}` as 'label_es'] ?? b.cat}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span className="mono" style={{ fontSize: 14, color: over ? 'var(--expense)' : 'var(--text)', fontWeight: 600 }}>{fmtMoney(b.spent, currency)}</span>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.of} {fmtMoney(b.limit, currency)}</span>
                        </div>
                      </div>
                      <div style={{ height: 7, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 999, transition: 'width 600ms cubic-bezier(0.2,0.7,0.2,1)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, color: over ? 'var(--expense)' : danger ? 'var(--warn)' : 'var(--text-3)', fontWeight: 500 }}>
                          {over ? `${fmtMoney(b.spent - b.limit, currency)} ${t.over}` : `${fmtMoney(b.limit - b.spent, currency)} ${t.left}`}
                        </span>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: over ? 'var(--expense)' : danger ? 'var(--warn)' : 'var(--text-3)' }}>{Math.round(pct)}%</span>
                      </div>
                    </div>
                    <button style={{ color: 'var(--text-3)', marginLeft: 4, padding: 6 }}><Icon name="more" size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
