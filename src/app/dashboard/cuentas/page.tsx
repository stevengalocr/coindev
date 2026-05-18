'use client';

import { useApp } from '@/hooks/useApp';
import { ACCOUNTS, MOVEMENTS, fmtMoney, type Account } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';
import { MoneyText } from '@/components/shell/MoneyText';
import { AccountGlyph } from '@/components/shell/CategoryGlyph';

export default function CuentasPage() {
  const { t, currency, lang } = useApp();
  const total = ACCOUNTS.reduce((s, a) => s + a.balance, 0);

  return (
    <div style={{ padding: '28px 32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            {t.accountsTitle}
          </h1>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              {t.netBalance}
            </span>
            <MoneyText amount={total} currency={currency} size={26} weight={600} />
          </div>
        </div>
        <button style={{
          padding: '9px 16px 9px 12px', borderRadius: 10, background: 'var(--surface)',
          border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 500,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="plus" size={15} stroke={2} /> {t.addAccount}
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {ACCOUNTS.map(acc => (
          <AccountCard key={acc.id} acc={acc} currency={currency} t={t} lang={lang} />
        ))}
        {/* Add placeholder */}
        <button style={{
          padding: '28px 20px', borderRadius: 20, background: 'transparent',
          border: '1.5px dashed var(--border-strong)', color: 'var(--text-3)',
          fontSize: 13.5, fontWeight: 500, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'border-color 150ms, color 150ms',
          minHeight: 140,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          <Icon name="plus" size={18} stroke={1.5} />
          {t.addAccount}
        </button>
      </div>
    </div>
  );
}

function AccountCard({ acc, currency, t, lang }: { acc: Account; currency: string; t: any; lang: string }) {
  const isCredit = acc.kind === 'credit';
  const used = isCredit ? Math.abs(acc.balance) : 0;
  const pct = isCredit && acc.limit ? (used / acc.limit) * 100 : 0;

  // Recent transactions for this account
  const recent = MOVEMENTS.filter(m => m.account === acc.id).slice(0, 3);

  return (
    <div className="cd-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90,
        background: `radial-gradient(circle, color-mix(in oklab, ${acc.color} 40%, transparent), transparent 70%)`,
        opacity: 0.3, pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <AccountGlyph acc={acc} size={44} />
            <div>
              <div style={{ fontSize: 14.5, color: 'var(--text)', fontWeight: 600 }}>{acc.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {(t as any)[acc.kind] || acc.kind}{acc.tail ? ` · ${acc.tail}` : ''}
              </div>
            </div>
          </div>
          <button style={{ color: 'var(--text-3)', padding: 4 }}><Icon name="more" size={16} /></button>
        </div>

        {/* Balance */}
        <MoneyText
          amount={Math.abs(acc.balance)}
          currency={currency as any}
          size={26}
          weight={600}
          style={{ color: acc.balance < 0 ? 'var(--expense)' : 'var(--text)' }}
        />

        {/* Credit bar */}
        {isCredit && acc.limit && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>
              <span>{lang === 'es' ? 'Usado' : 'Used'}</span>
              <span className="mono">{fmtMoney(used, currency as any)} / {fmtMoney(acc.limit, currency as any)}</span>
            </div>
            <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct > 75 ? 'var(--expense)' : acc.color, borderRadius: 999 }} />
            </div>
          </div>
        )}

        {/* Recent mini transactions */}
        {recent.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            {recent.map((m, i) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 0', fontSize: 12, color: 'var(--text-2)',
                borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{m.desc}</span>
                <span className="mono" style={{ fontSize: 11.5, color: m.type === 'income' ? 'var(--income)' : 'var(--expense)', fontWeight: 600 }}>
                  {m.type === 'income' ? '+' : '−'}{fmtMoney(m.amount, currency as any)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
