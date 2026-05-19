'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { CAT, fmtMoney } from '@/lib/data';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { Icon } from '@/components/ui/Icon';
import { AddMovementModal } from '@/components/screens/AddMovementModal';

export default function GastosFijosPage() {
  const { t, currency, lang } = useApp();
  const { movements, loading } = useData();
  const [addOpen, setAddOpen] = useState(false);

  const fixedMovs = movements.filter(m => m.type === 'expense' && m.fixed);
  const map: Record<string, typeof fixedMovs[0]> = {};
  fixedMovs.forEach(m => { if (!map[m.desc]) map[m.desc] = m; });
  const items = Object.values(map).sort((a, b) => b.amount - a.amount);

  const total = items.reduce((s, m) => s + m.amount, 0);
  const income = movements.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
  const ratio = income > 0 ? total / income : 0;
  const perDay = total / 30;
  const ratioColor = ratio > 0.6 ? 'var(--expense)' : ratio > 0.45 ? 'var(--warn)' : 'var(--income)';

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>{t.fixedTitle}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{t.fixedSubtitle}</div>
        </div>
        <button onClick={() => setAddOpen(true)} style={{ padding: '9px 16px 9px 12px', borderRadius: 10, background: 'var(--gradient-hero)', color: '#0A0F1C', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="plus" size={15} stroke={2.4} /> {lang === 'es' ? 'Nuevo gasto fijo' : 'New fixed expense'}
        </button>
      </div>
      <AddMovementModal open={addOpen} onClose={() => setAddOpen(false)} initialFixed initialType="expense" />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>Cargando…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>
          {lang === 'es' ? 'Sin gastos fijos registrados.' : 'No fixed expenses recorded.'}
        </div>
      ) : (
        <>
          <div className="cd-card" style={{ padding: '22px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 100% 0%, color-mix(in oklab, var(--violet) 22%, transparent), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>{t.monthly}</div>
              <MoneyText amount={total} currency={currency} size={36} weight={600} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t.perDay}</div>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{fmtMoney(perDay, currency)}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t.ofIncome}</div>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: ratioColor }}>{Math.round(ratio * 100)}%</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{lang === 'es' ? 'Compromisos' : 'Commitments'}</div>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{items.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(m => {
              const c = CAT[m.cat];
              const now = new Date();
              const nextDay = new Date(now.getFullYear(), now.getMonth() + 1, m.date.getDate());
              return (
                <div key={m.id} className="cd-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 150ms' }}
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
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{fmtMoney(m.amount / 30, currency)}/d</div>
                  </div>
                  <button style={{ color: 'var(--text-3)', marginLeft: 4, padding: 6 }}><Icon name="more" size={15} /></button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
