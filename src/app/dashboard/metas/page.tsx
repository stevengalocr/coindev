'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { fmtMoney, type SavingsGoal } from '@/lib/data';
import { MoneyText } from '@/components/shell/MoneyText';
import { AddGoalModal } from '@/components/screens/AddGoalModal';
import { Icon } from '@/components/ui/Icon';

function statusColor(status: SavingsGoal['status']): string {
  switch (status) {
    case 'active':    return 'var(--blue)';
    case 'completed': return 'var(--income)';
    case 'paused':    return 'var(--text-3)';
    case 'cancelled': return 'var(--expense)';
  }
}

function statusLabel(status: SavingsGoal['status'], lang: string): string {
  const map = {
    active:    lang === 'es' ? 'Activa'     : 'Active',
    completed: lang === 'es' ? 'Completada' : 'Completed',
    paused:    lang === 'es' ? 'Pausada'    : 'Paused',
    cancelled: lang === 'es' ? 'Cancelada'  : 'Cancelled',
  };
  return map[status];
}

function monthsRemaining(target: Date): number {
  const now = new Date();
  const diff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, diff);
}

export default function MetasPage() {
  const { t, currency, lang } = useApp();
  const { goals, loading, deleteGoal } = useData();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<SavingsGoal | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalTarget  = goals.reduce((s, g) => s + g.target, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const overallPct   = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
  const activeGoals  = goals.filter(g => g.status === 'active');
  const otherGoals   = goals.filter(g => g.status !== 'active');

  async function handleDelete(g: SavingsGoal) {
    setMenuId(null);
    setConfirmDeleteId(null);
    await deleteGoal(g.id);
  }

  return (
    <div>
      {menuId !== null && (
        <div onClick={() => { setMenuId(null); setConfirmDeleteId(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            {t.goalsTitle}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{t.goalsSubtitle}</div>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{ padding: '9px 16px 9px 12px', borderRadius: 10, background: 'var(--gradient-hero)', color: '#0A0F1C', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="plus" size={15} stroke={2.4} /> {t.addGoal}
        </button>
      </div>
      <AddGoalModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddGoalModal open={!!editItem} onClose={() => setEditItem(null)} initialData={editItem ?? undefined} />

      {/* States */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Skeleton summary */}
          <div className="cd-card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 10, width: '50%', borderRadius: 4, background: 'var(--surface-3)' }} />
                  <div style={{ height: 24, width: '70%', borderRadius: 6, background: 'var(--surface-3)' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, height: 6, borderRadius: 3, background: 'var(--surface-3)' }} />
          </div>
          {/* Skeleton cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[1, 2].map(i => (
              <div key={i} className="cd-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface-3)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 14, width: '55%', borderRadius: 4, background: 'var(--surface-3)' }} />
                    <div style={{ height: 10, width: '35%', borderRadius: 4, background: 'var(--surface-3)' }} />
                  </div>
                  <div style={{ height: 20, width: 50, borderRadius: 6, background: 'var(--surface-3)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ height: 18, width: '40%', borderRadius: 4, background: 'var(--surface-3)' }} />
                    <div style={{ height: 12, width: '25%', borderRadius: 4, background: 'var(--surface-3)' }} />
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-3)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : goals.length === 0 ? (
        <div className="cd-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
            <Icon name="target" size={26} stroke={1.6} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {lang === 'es' ? 'Sin metas todavía' : 'No goals yet'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 300, margin: '0 auto 20px' }}>
            {lang === 'es'
              ? 'Crea tu primera meta de ahorro para empezar a seguir tu progreso.'
              : 'Create your first savings goal to start tracking your progress.'}
          </div>
          <button
            onClick={() => setAddOpen(true)}
            style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--gradient-hero)', color: '#0A0F1C', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="plus" size={14} stroke={2.4} />
            {lang === 'es' ? 'Crear primera meta' : 'Create first goal'}
          </button>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="cd-card" style={{ padding: '22px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 0% 100%, color-mix(in oklab, var(--blue) 18%, transparent), transparent 60%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="goals-summary">
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>{t.target}</div>
                  <MoneyText amount={totalTarget} currency={currency} size={26} weight={600} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>{t.achieved}</div>
                  <MoneyText amount={totalCurrent} currency={currency} size={26} weight={600} style={{ color: 'var(--income)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>
                    {lang === 'es' ? 'Progreso global' : 'Overall progress'}
                  </div>
                  <span className="mono" style={{ fontSize: 26, fontWeight: 600, color: overallPct >= 75 ? 'var(--income)' : overallPct >= 40 ? 'var(--warn)' : 'var(--text)' }}>
                    {overallPct}%
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 16, height: 6, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, overallPct)}%`, background: 'var(--gradient-hero)', transition: 'width 600ms ease' }} />
              </div>
            </div>
          </div>

          {/* Active goals grid */}
          {activeGoals.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                {lang === 'es' ? `Activas · ${activeGoals.length}` : `Active · ${activeGoals.length}`}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
                {activeGoals.map(g => (
                  <GoalCard
                    key={g.id} goal={g} currency={currency} lang={lang} t={t}
                    menuId={menuId} confirmDeleteId={confirmDeleteId}
                    onMenuToggle={(id) => { setMenuId(menuId === id ? null : id); setConfirmDeleteId(null); }}
                    onEdit={(goal) => { setEditItem(goal); setMenuId(null); }}
                    onDeleteConfirm={(id) => setConfirmDeleteId(id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}

          {/* Other goals */}
          {otherGoals.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                {lang === 'es' ? `Otras · ${otherGoals.length}` : `Others · ${otherGoals.length}`}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {otherGoals.map(g => (
                  <GoalCard
                    key={g.id} goal={g} currency={currency} lang={lang} t={t}
                    menuId={menuId} confirmDeleteId={confirmDeleteId}
                    onMenuToggle={(id) => { setMenuId(menuId === id ? null : id); setConfirmDeleteId(null); }}
                    onEdit={(goal) => { setEditItem(goal); setMenuId(null); }}
                    onDeleteConfirm={(id) => setConfirmDeleteId(id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <style>{`
        @media (max-width: 640px) {
          .goals-summary { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

interface CardProps {
  goal: SavingsGoal;
  t: { target: string; achieved: string; monthlyNeeded: string; completed: string; paused: string };
  currency: 'CRC' | 'USD';
  lang: string;
  menuId: string | null;
  confirmDeleteId: string | null;
  onMenuToggle: (id: string) => void;
  onEdit: (goal: SavingsGoal) => void;
  onDeleteConfirm: (id: string) => void;
  onDelete: (goal: SavingsGoal) => void;
}

function GoalCard({ goal, currency, lang, t, menuId, confirmDeleteId, onMenuToggle, onEdit, onDeleteConfirm, onDelete }: CardProps) {
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const remaining = goal.target - goal.current;
  const monthlyNeeded = goal.targetDate && remaining > 0 ? remaining / monthsRemaining(goal.targetDate) : null;
  const barColor = goal.status === 'completed' ? 'var(--income)' : goal.status === 'paused' ? 'var(--text-3)' : 'var(--blue)';
  const sColor = statusColor(goal.status);

  return (
    <div className="cd-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top: icon + name + badge + more */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--text-2)' }}>
          <Icon name={goal.icon} size={20} stroke={1.7} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {goal.name}
          </div>
          {goal.description && (
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {goal.description}
            </div>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: sColor, border: `1px solid ${sColor}`, borderRadius: 6, padding: '2px 7px', letterSpacing: '0.04em', flexShrink: 0, opacity: 0.9 }}>
          {statusLabel(goal.status, lang)}
        </span>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onMenuToggle(goal.id); }}
            style={{ color: 'var(--text-3)', padding: 4 }}
          >
            <Icon name="more" size={15} />
          </button>
          {menuId === goal.id && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 50,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, boxShadow: 'var(--shadow-pop)',
              minWidth: 160, overflow: 'hidden',
            }}>
              <button onClick={e => { e.stopPropagation(); onEdit(goal); }} style={{
                width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13.5, color: 'var(--text)', fontWeight: 500, textAlign: 'left',
                background: 'transparent', borderBottom: '1px solid var(--border)',
              }}>
                <Icon name="edit" size={15} /> {lang === 'es' ? 'Editar' : 'Edit'}
              </button>
              {confirmDeleteId === goal.id ? (
                <button onClick={e => { e.stopPropagation(); onDelete(goal); }} style={{
                  width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13.5, color: 'var(--expense)', fontWeight: 600, textAlign: 'left',
                  background: 'var(--expense-soft)',
                }}>
                  <Icon name="trash" size={15} /> {lang === 'es' ? '¿Confirmar?' : 'Confirm?'}
                </button>
              ) : (
                <button onClick={e => { e.stopPropagation(); onDeleteConfirm(goal.id); }} style={{
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

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <MoneyText amount={goal.current} currency={currency} size={18} weight={700} />
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
            {lang === 'es' ? 'de' : 'of'}{' '}
            <span className="mono" style={{ fontWeight: 600, color: 'var(--text-2)' }}>{fmtMoney(goal.target, currency)}</span>
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: barColor, transition: 'width 600ms ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{pct}%</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {goal.targetDate
              ? goal.targetDate.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
              : lang === 'es' ? 'Sin fecha límite' : 'No deadline'}
          </span>
        </div>
      </div>

      {/* Monthly needed */}
      {monthlyNeeded !== null && goal.status === 'active' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.monthlyNeeded}</span>
          <MoneyText amount={monthlyNeeded} currency={currency} size={13} weight={700} style={{ color: 'var(--blue)' }} />
        </div>
      )}
    </div>
  );
}
