'use client';

import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { fmtMoney, type SavingsGoal } from '@/lib/data';
import { MoneyText } from '@/components/shell/MoneyText';

function statusColor(status: SavingsGoal['status']): string {
  switch (status) {
    case 'active':    return 'var(--blue)';
    case 'completed': return 'var(--income)';
    case 'paused':    return 'var(--text-3)';
    case 'cancelled': return 'var(--expense)';
  }
}

function statusLabel(status: SavingsGoal['status'], t: { completed: string; paused: string }): string {
  switch (status) {
    case 'active':    return 'Activa';
    case 'completed': return t.completed;
    case 'paused':    return t.paused;
    case 'cancelled': return 'Cancelada';
  }
}

function monthsRemaining(target: Date): number {
  const now = new Date();
  const diff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, diff);
}

export default function MetasPage() {
  const { t, currency, lang } = useApp();
  const { goals, loading } = useData();

  const totalTarget  = goals.reduce((s, g) => s + g.target, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const overallPct   = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  const activeGoals = goals.filter(g => g.status === 'active');
  const otherGoals  = goals.filter(g => g.status !== 'active');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            {t.goalsTitle}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{t.goalsSubtitle}</div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 16px', height: 36, borderRadius: 'var(--r-md)',
          background: 'var(--gradient-hero)', color: '#0C0E14',
          fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', flexShrink: 0,
        }}>
          + {t.addGoal}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 14 }}>
          {lang === 'es' ? 'Cargando…' : 'Loading…'}
        </div>
      ) : goals.length === 0 ? (
        <div className="cd-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {lang === 'es' ? 'Sin metas todavía' : 'No goals yet'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 300, margin: '0 auto' }}>
            {lang === 'es'
              ? 'Crea tu primera meta de ahorro para empezar a seguir tu progreso.'
              : 'Create your first savings goal to start tracking your progress.'}
          </div>
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
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>
                    {t.target}
                  </div>
                  <MoneyText amount={totalTarget} currency={currency} size={28} weight={600} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>
                    {t.achieved}
                  </div>
                  <MoneyText amount={totalCurrent} currency={currency} size={28} weight={600} style={{ color: 'var(--income)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>
                    {lang === 'es' ? 'Progreso global' : 'Overall progress'}
                  </div>
                  <span className="mono" style={{ fontSize: 28, fontWeight: 600, color: overallPct >= 75 ? 'var(--income)' : overallPct >= 40 ? 'var(--warn)' : 'var(--text)' }}>
                    {overallPct}%
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 16, height: 6, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${Math.min(100, overallPct)}%`,
                  background: 'var(--gradient-hero)',
                  transition: 'width 600ms ease',
                }} />
              </div>
            </div>
          </div>

          {/* Active goals grid */}
          {activeGoals.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                {lang === 'es' ? `Activas · ${activeGoals.length}` : `Active · ${activeGoals.length}`}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
                {activeGoals.map(g => <GoalCard key={g.id} goal={g} t={t} currency={currency} lang={lang} />)}
              </div>
            </>
          )}

          {/* Other goals */}
          {otherGoals.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                {lang === 'es' ? `Otras · ${otherGoals.length}` : `Others · ${otherGoals.length}`}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {otherGoals.map(g => <GoalCard key={g.id} goal={g} t={t} currency={currency} lang={lang} />)}
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
}

function GoalCard({ goal, t, currency, lang }: CardProps) {
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const remaining = goal.target - goal.current;
  const monthlyNeeded = goal.targetDate && remaining > 0
    ? remaining / monthsRemaining(goal.targetDate)
    : null;
  const barColor = goal.status === 'completed'
    ? 'var(--income)'
    : goal.status === 'paused'
    ? 'var(--text-3)'
    : 'var(--blue)';
  const sColor = statusColor(goal.status);

  return (
    <div className="cd-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, cursor: 'default' }}>
      {/* Top row: icon + name + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, background: 'var(--surface-2)',
          display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0,
        }}>
          {goal.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {goal.name}
          </div>
          {goal.description && (
            <div style={{
              fontSize: 11.5, color: 'var(--text-3)', marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {goal.description}
            </div>
          )}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, color: sColor,
          border: `1px solid ${sColor}`, borderRadius: 6,
          padding: '2px 7px', letterSpacing: '0.04em', flexShrink: 0,
          opacity: 0.85,
        }}>
          {statusLabel(goal.status, t)}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <MoneyText amount={goal.current} currency={currency} size={18} weight={700} />
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
            {lang === 'es' ? 'de' : 'of'}{' '}
            <span className="mono" style={{ fontWeight: 600, color: 'var(--text-2)' }}>
              {fmtMoney(goal.target, currency)}
            </span>
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: `${pct}%`,
            background: barColor,
            transition: 'width 600ms ease',
          }} />
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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.monthlyNeeded}</span>
          <MoneyText amount={monthlyNeeded} currency={currency} size={13} weight={700} style={{ color: 'var(--blue)' }} />
        </div>
      )}
    </div>
  );
}
