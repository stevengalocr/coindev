'use client';

import { fmtMoney } from '@/lib/data';

interface Props {
  amount: number;
  currency?: string;
  size?: number;
  weight?: number;
  sign?: boolean;
  type?: 'income' | 'expense';
  style?: React.CSSProperties;
}

export function MoneyText({ amount, currency = 'CRC', size = 28, weight = 600, sign = false, type, style }: Props) {
  const formatted = fmtMoney(amount, currency, { sign });
  const color = type === 'income' ? 'var(--income)' : type === 'expense' ? 'var(--expense)' : 'var(--text)';
  return (
    <span
      className="mono"
      style={{ fontSize: size, fontWeight: weight, color, letterSpacing: '-0.02em', lineHeight: 1, ...style }}
    >
      {formatted}
    </span>
  );
}
