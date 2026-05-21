'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';
import { AddAccountModal } from '@/components/screens/AddAccountModal';
import { AddMovementModal } from '@/components/screens/AddMovementModal';
import { AddBudgetModal } from '@/components/screens/AddBudgetModal';

const LS_KEY = 'cd_onboarding_v1';

type Step = 'account' | 'movement' | 'budget' | 'done';

interface StepDef {
  key: Step;
  icon: string;
  label_es: string;
  label_en: string;
  desc_es: string;
  desc_en: string;
  cta_es: string;
  cta_en: string;
}

const STEPS: StepDef[] = [
  {
    key: 'account',
    icon: 'bank',
    label_es: 'Agrega una cuenta',
    label_en: 'Add an account',
    desc_es: 'Registra tu banco, efectivo o tarjeta para empezar a controlar tus finanzas.',
    desc_en: 'Register your bank, cash or card to start tracking your finances.',
    cta_es: 'Crear cuenta',
    cta_en: 'Create account',
  },
  {
    key: 'movement',
    icon: 'list',
    label_es: 'Registra un movimiento',
    label_en: 'Log a transaction',
    desc_es: 'Anota tu primer ingreso o gasto para ver tus estadísticas en acción.',
    desc_en: 'Log your first income or expense to see your stats come alive.',
    cta_es: 'Agregar movimiento',
    cta_en: 'Add transaction',
  },
  {
    key: 'budget',
    icon: 'flag',
    label_es: 'Define un presupuesto',
    label_en: 'Set a budget',
    desc_es: 'Establece límites por categoría para mantener tus gastos bajo control.',
    desc_en: 'Set limits by category to keep your spending in check.',
    cta_es: 'Crear presupuesto',
    cta_en: 'Create budget',
  },
];

export function OnboardingWizard() {
  const { lang } = useApp();
  const { accounts, movements, budgets } = useData();
  const [step, setStep] = useState<Step>('account');
  const [dismissed, setDismissed] = useState(true); // start hidden until localStorage check
  const [addAccOpen, setAddAccOpen] = useState(false);
  const [addMovOpen, setAddMovOpen] = useState(false);
  const [addBudOpen, setAddBudOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored === 'done') { setDismissed(true); return; }
    setDismissed(false);
    const saved = stored as Step | null;
    if (saved && STEPS.some(s => s.key === saved)) setStep(saved);
  }, []);

  // Auto-advance when data arrives
  useEffect(() => {
    if (step === 'account' && accounts.length > 0) advance('movement');
    if (step === 'movement' && movements.length > 0) advance('budget');
    if (step === 'budget' && budgets.length > 0) advance('done');
  }, [accounts, movements, budgets, step]);

  function advance(next: Step) {
    setStep(next);
    if (next === 'done') {
      localStorage.setItem(LS_KEY, 'done');
      setDismissed(true);
    } else {
      localStorage.setItem(LS_KEY, next);
    }
  }

  function dismiss() {
    localStorage.setItem(LS_KEY, 'done');
    setDismissed(true);
  }

  if (dismissed || step === 'done') return null;

  const stepIdx = STEPS.findIndex(s => s.key === step);
  const current = STEPS[stepIdx];

  return (
    <>
      <div className="cd-card" style={{
        padding: '28px 28px 24px', marginBottom: 28, position: 'relative', overflow: 'hidden',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}>
        {/* Glow bg */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 0% 0%, color-mix(in oklab, var(--blue) 10%, transparent), transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in oklab, var(--blue) 18%, var(--surface-2))', display: 'grid', placeItems: 'center', color: 'var(--blue)' }}>
                <Icon name="spark" size={18} stroke={1.7} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                  {lang === 'es' ? '¡Bienvenido a CoinDev!' : 'Welcome to CoinDev!'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                  {lang === 'es' ? 'Completa estos 3 pasos para empezar' : 'Complete these 3 steps to get started'}
                </div>
              </div>
            </div>
            <button onClick={dismiss} style={{ color: 'var(--text-3)', padding: 4, flexShrink: 0 }}>
              <Icon name="x" size={16} stroke={2} />
            </button>
          </div>

          {/* Steps progress */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {STEPS.map((s, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              return (
                <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{
                    height: 4, borderRadius: 2,
                    background: done ? 'var(--income)' : active ? 'var(--blue)' : 'var(--surface-3)',
                    transition: 'background 300ms',
                  }} />
                  <div style={{
                    fontSize: 11, fontWeight: active ? 600 : 400,
                    color: done ? 'var(--income)' : active ? 'var(--blue)' : 'var(--text-3)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {done && <Icon name="check" size={10} stroke={2.5} />}
                    {lang === 'es' ? `Paso ${i + 1}` : `Step ${i + 1}`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current step */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in oklab, var(--blue) 14%, var(--surface-2))', border: '1px solid color-mix(in oklab, var(--blue) 25%, var(--border))', display: 'grid', placeItems: 'center', color: 'var(--blue)', flexShrink: 0 }}>
              <Icon name={current.icon} size={24} stroke={1.6} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                {lang === 'es' ? current.label_es : current.label_en}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                {lang === 'es' ? current.desc_es : current.desc_en}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button
              onClick={() => {
                if (step === 'account') setAddAccOpen(true);
                if (step === 'movement') setAddMovOpen(true);
                if (step === 'budget') setAddBudOpen(true);
              }}
              style={{ padding: '10px 20px', borderRadius: 11, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="plus" size={14} stroke={2.5} />
              {lang === 'es' ? current.cta_es : current.cta_en}
            </button>
            <button onClick={() => advance(STEPS[stepIdx + 1]?.key ?? 'done')} style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
              {lang === 'es' ? 'Saltar paso' : 'Skip step'}
            </button>
          </div>
        </div>
      </div>

      <AddAccountModal open={addAccOpen} onClose={() => setAddAccOpen(false)} />
      <AddMovementModal open={addMovOpen} onClose={() => setAddMovOpen(false)} />
      <AddBudgetModal open={addBudOpen} onClose={() => setAddBudOpen(false)} />
    </>
  );
}
