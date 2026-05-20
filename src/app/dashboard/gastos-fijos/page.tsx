'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { CAT, fmtMoney, type Movement } from '@/lib/data';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { Icon } from '@/components/ui/Icon';
import { AddMovementModal } from '@/components/screens/AddMovementModal';

export default function GastosFijosPage() {
  const { t, currency, lang } = useApp();
  const { movements, loading, deleteTransaction } = useData();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Movement | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fixedMovs = movements.filter(m => m.type === 'expense' && m.fixed);
  const map: Record<string, typeof fixedMovs[0]> = {};
  fixedMovs.forEach(m => { if (!map[m.desc]) map[m.desc] = m; });
  const items = Object.values(map).sort((a, b) => b.amount - a.amount);

  const total = items.reduce((s, m) => s + m.amount, 0);
  const income = movements.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
  const ratio = income > 0 ? total / income : 0;
  const perDay = total / 30;
  const ratioColor = ratio > 0.6 ? 'var(--expense)' : ratio > 0.45 ? 'var(--warn)' : 'var(--income)';

  async function handleDelete(m: Movement) {
    setMenuId(null);
    setConfirmDeleteId(null);
    await deleteTransaction(m.id, m.type, m.amount, m.account);
  }

  return (
    <div>
      {menuId !== null && (
        <div onClick={() => { setMenuId(null); setConfirmDeleteId(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
      )}

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
      <AddMovementModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        initialData={editItem ?? undefined}
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} className="cd-card" style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface-3)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 14, width: '45%', borderRadius: 4, background: 'var(--surface-3)' }} />
                <div style={{ height: 11, width: '30%', borderRadius: 4, background: 'var(--surface-3)' }} />
              </div>
              <div style={{ height: 16, width: 70, borderRadius: 4, background: 'var(--surface-3)' }} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="cd-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
            <Icon name="shield" size={26} stroke={1.6} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {lang === 'es' ? 'Sin gastos fijos' : 'No fixed expenses'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 300, margin: '0 auto 20px' }}>
            {lang === 'es' ? 'Registra tus gastos recurrentes como alquiler, suscripciones y servicios.' : 'Record your recurring expenses like rent, subscriptions and services.'}
          </div>
          <button onClick={() => setAddOpen(true)} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--gradient-hero)', color: '#0A0F1C', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} stroke={2.4} />
            {lang === 'es' ? 'Agregar gasto fijo' : 'Add fixed expense'}
          </button>
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
                <div key={m.id} className="cd-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 150ms', position: 'relative' }}
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
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuId(menuId === m.id ? null : m.id); setConfirmDeleteId(null); }}
                      style={{ color: 'var(--text-3)', marginLeft: 4, padding: 6 }}
                    >
                      <Icon name="more" size={15} />
                    </button>
                    {menuId === m.id && (
                      <div style={{
                        position: 'absolute', top: '100%', right: 0, zIndex: 50,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 12, boxShadow: 'var(--shadow-pop)',
                        minWidth: 160, overflow: 'hidden',
                      }}>
                        <button onClick={e => { e.stopPropagation(); setEditItem(m); setMenuId(null); }} style={{
                          width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                          fontSize: 13.5, color: 'var(--text)', fontWeight: 500, textAlign: 'left',
                          background: 'transparent', borderBottom: '1px solid var(--border)',
                        }}>
                          <Icon name="edit" size={15} /> {lang === 'es' ? 'Editar' : 'Edit'}
                        </button>
                        {confirmDeleteId === m.id ? (
                          <button onClick={e => { e.stopPropagation(); handleDelete(m); }} style={{
                            width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                            fontSize: 13.5, color: 'var(--expense)', fontWeight: 600, textAlign: 'left',
                            background: 'var(--expense-soft)',
                          }}>
                            <Icon name="trash" size={15} /> {lang === 'es' ? '¿Confirmar?' : 'Confirm?'}
                          </button>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(m.id); }} style={{
                            width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                            fontSize: 13.5, color: 'var(--expense)', fontWeight: 500, textAlign: 'left',
                            background: 'transparent',
                          }}>
                            <Icon name="trash" size={15} /> {lang === 'es' ? 'Eliminar' : 'Delete'}
                          </button>
                        )}
                      </div>
                    )}
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
