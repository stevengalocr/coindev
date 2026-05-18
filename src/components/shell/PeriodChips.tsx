'use client';

import type { T, Period } from '@/lib/data';

interface Props {
  value: Period;
  onChange: (p: Period) => void;
  t: T;
}

export function PeriodChips({ value, onChange, t }: Props) {
  const items: { id: Period; label: string }[] = [
    { id: 'week', label: t.week },
    { id: 'month', label: t.month },
    { id: 'quarter', label: t.quarter },
    { id: 'year', label: t.year },
  ];
  return (
    <div style={{ display: 'inline-flex', padding: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
      {items.map(it => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 500,
            color: value === it.id ? 'var(--text)' : 'var(--text-3)',
            background: value === it.id ? 'var(--surface-3)' : 'transparent',
            transition: 'all 120ms',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
