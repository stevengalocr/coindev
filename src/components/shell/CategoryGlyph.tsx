'use client';

import { CAT } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';

interface Props {
  id: string;
  size?: number;
}

export function CategoryGlyph({ id, size = 36 }: Props) {
  const c = CAT[id];
  if (!c) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.6,
        background: `color-mix(in oklab, ${c.color} 22%, transparent)`,
        color: c.color,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        border: `1px solid color-mix(in oklab, ${c.color} 35%, transparent)`,
      }}
    >
      <Icon name={c.glyph} size={Math.round(size * 0.52)} stroke={1.8} />
    </div>
  );
}

export function AccountGlyph({ acc, size = 36 }: { acc: { kind: string; color: string }; size?: number }) {
  const map: Record<string, string> = { bank: 'bank', cash: 'cash', savings: 'piggy', credit: 'card' };
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: `color-mix(in oklab, ${acc.color} 16%, transparent)`,
        color: acc.color,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        border: `1px solid color-mix(in oklab, ${acc.color} 30%, transparent)`,
      }}
    >
      <Icon name={map[acc.kind] || 'wallet'} size={Math.round(size * 0.5)} stroke={1.7} />
    </div>
  );
}
