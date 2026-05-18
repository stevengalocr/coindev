'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/hooks/useApp';
import { Icon } from '@/components/ui/Icon';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph, AccountGlyph } from '@/components/shell/CategoryGlyph';
import { PeriodChips } from '@/components/shell/PeriodChips';
import { Donut, YearChart, HeroSwoosh } from '@/components/shell/Charts';
import {
  MOVEMENTS,
  ACCOUNTS,
  BUDGETS,
  YEAR_EVOLUTION,
  CAT,
  filterMovs,
  aggregate,
  fmtMoney,
  type Period,
  type Account,
} from '@/lib/data';

/* ─── tiny helpers ─────────────────────────────────────────────────── */

function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

function formatDate(d: Date) {
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
}

function pct(num: number, den: number) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

/* ─── sub-components ─────────────────────────────────────────────── */

function StatCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="cd-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

function DeltaBadge({ text, positive = true }: { text: string; positive?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      padding: '3px 8px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: positive ? 'var(--income-soft)' : 'var(--expense-soft)',
      color: positive ? 'var(--income)' : 'var(--expense)',
      letterSpacing: '-0.01em',
    }}>
      <Icon name={positive ? 'arrow-up' : 'arrow-down'} size={10} stroke={2.5} />
      {text}
    </span>
  );
}

function SectionCard({
  title,
  right,
  children,
  style,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="cd-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* Progress bar */
function Bar({
  ratio,
  color = 'var(--gradient-hero)',
  height = 6,
  bg = 'var(--surface-2)',
  radius = 99,
}: {
  ratio: number;
  color?: string;
  height?: number;
  bg?: string;
  radius?: number;
}) {
  const pct = clamp(ratio) * 100;
  return (
    <div style={{ height, background: bg, borderRadius: radius, overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: radius, transition: 'width 400ms' }} />
    </div>
  );
}

/* ─── Hero balance card ─────────────────────────────────────────────────── */

function HeroCard({ income, expense, net, currency }: { income: number; expense: number; net: number; currency: import('@/lib/data').Currency }) {
  return (
    <StatCard style={{ gridArea: 'hero', background: 'var(--surface)' }}>
      <HeroSwoosh opacity={0.9} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
          Balance neto
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <MoneyText amount={net} currency={currency} size={36} weight={700} />
          <DeltaBadge text="+12.4%" positive />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>vs. mes anterior</div>

        <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3 }}>Ingresos</div>
            <MoneyText amount={income} currency={currency} size={14} weight={600} type="income" />
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 3 }}>Gastos</div>
            <MoneyText amount={expense} currency={currency} size={14} weight={600} type="expense" />
          </div>
        </div>
      </div>
    </StatCard>
  );
}

/* ─── Mini stat card (income / expense / savings) ─────────────────────── */

function MiniStat({
  icon,
  iconBg,
  iconColor,
  label,
  amount,
  delta,
  positive,
  currency,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  amount: number;
  delta: string;
  positive?: boolean;
  currency: import('@/lib/data').Currency;
}) {
  return (
    <StatCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: iconBg,
          color: iconColor,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}>
          <Icon name={icon} size={18} stroke={1.8} />
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)' }}>{label}</span>
      </div>
      <MoneyText amount={amount} currency={currency} size={24} weight={700} />
      <div style={{ marginTop: 8 }}>
        <DeltaBadge text={delta} positive={positive} />
      </div>
    </StatCard>
  );
}

/* ─── YearPanel ─────────────────────────────────────────────────────────── */

function YearPanel({ currency }: { currency: import('@/lib/data').Currency }) {
  return (
    <SectionCard
      title="Evolución del año"
      right={
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--income)', display: 'inline-block' }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Ingresos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--expense)', display: 'inline-block' }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Gastos</span>
          </div>
        </div>
      }
    >
      <YearChart data={YEAR_EVOLUTION} currency={currency} big />
    </SectionCard>
  );
}

/* ─── BudgetsPanel ─────────────────────────────────────────────────────── */

function BudgetsPanel({ currency, lang }: { currency: import('@/lib/data').Currency; lang: import('@/lib/data').Lang }) {
  const total = BUDGETS.reduce((s, b) => s + b.spent, 0);
  const totalLimit = BUDGETS.reduce((s, b) => s + b.limit, 0);
  const overallRatio = clamp(total / totalLimit);

  const budgetColors: Record<string, string> = {
    groceries: '#4FE0A9',
    food:      '#FF8BB5',
    transport: '#5B9BFF',
    fun:       '#C77DFF',
    health:    '#FF6B83',
  };

  return (
    <SectionCard title="Presupuestos">
      {/* overall */}
      <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Total gastado</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            <span className="mono" style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
              {fmtMoney(total, currency)}
            </span>
            {' / '}
            {fmtMoney(totalLimit, currency)}
          </span>
        </div>
        <Bar ratio={overallRatio} height={8} color="var(--gradient-hero)" />
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
          {pct(total, totalLimit)}% del presupuesto total
        </div>
      </div>

      {/* list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {BUDGETS.slice(0, 4).map(b => {
          const cat = CAT[b.cat];
          const ratio = clamp(b.spent / b.limit);
          const over = b.spent > b.limit;
          const color = budgetColors[b.cat] || cat?.color || 'var(--income)';
          const label = lang === 'es' ? cat?.label_es : cat?.label_en;
          return (
            <div key={b.cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CategoryGlyph id={b.cat} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 11.5, color: over ? 'var(--expense)' : 'var(--text-3)', fontWeight: over ? 600 : 400 }}>
                    {pct(b.spent, b.limit)}%
                  </span>
                </div>
                <Bar ratio={ratio} color={color} height={5} />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ─── RecentPanel ────────────────────────────────────────────────────────── */

function RecentPanel({
  period,
  currency,
  lang,
}: {
  period: Period;
  currency: import('@/lib/data').Currency;
  lang: import('@/lib/data').Lang;
}) {
  const movs = filterMovs(MOVEMENTS, period).slice(0, 7);

  return (
    <SectionCard
      title="Movimientos recientes"
      right={
        <Link href="/dashboard/movimientos" style={{
          fontSize: 12.5,
          color: 'var(--blue)',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontWeight: 500,
        }}>
          Ver todo
          <Icon name="arrow-right" size={13} stroke={2} />
        </Link>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {movs.map((m, idx) => {
          const cat = CAT[m.cat];
          const acct = ACCOUNTS.find(a => a.id === m.account);
          const catLabel = lang === 'es' ? cat?.label_es : cat?.label_en;
          return (
            <div key={m.id}>
              {idx > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 0' }} />}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                alignItems: 'center',
                gap: 12,
                padding: '11px 0',
              }}>
                {/* desc + category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <CategoryGlyph id={m.cat} size={34} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.01em',
                    }}>
                      {m.desc}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>{catLabel}</div>
                  </div>
                </div>

                {/* account */}
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                  {acct?.name.split(' ')[0]}
                </div>

                {/* date */}
                <div style={{ fontSize: 11.5, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
                  {formatDate(m.date)}
                </div>

                {/* amount */}
                <MoneyText
                  amount={m.amount}
                  currency={currency}
                  size={13.5}
                  weight={600}
                  sign
                  type={m.type}
                  style={{ textAlign: 'right', whiteSpace: 'nowrap' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ─── CategoryPanel ──────────────────────────────────────────────────────── */

function CategoryPanel({ period, currency, lang }: { period: Period; currency: import('@/lib/data').Currency; lang: import('@/lib/data').Lang }) {
  const movs = filterMovs(MOVEMENTS, period).filter(m => m.type === 'expense');
  const total = movs.reduce((s, m) => s + m.amount, 0);

  // aggregate by category
  const bycat: Record<string, number> = {};
  movs.forEach(m => { bycat[m.cat] = (bycat[m.cat] || 0) + m.amount; });
  const sorted = Object.entries(bycat).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const donutData = sorted.map(([catId, value]) => ({
    value,
    color: CAT[catId]?.color || '#888',
    cat: catId,
  }));

  return (
    <SectionCard
      title="Distribución por categoría"
      right={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>Este mes</span>}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flexShrink: 0 }}>
          <Donut
            data={donutData}
            size={148}
            stroke={22}
            centerLabel="Gastos"
            centerValue={fmtMoney(total, currency)}
          />
        </div>

        {/* legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {sorted.map(([catId, value]) => {
            const cat = CAT[catId];
            const label = lang === 'es' ? cat?.label_es : cat?.label_en;
            const ratio = total > 0 ? value / total : 0;
            return (
              <div key={catId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: cat?.color || '#888',
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {label}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>
                  {Math.round(ratio * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── AccountCard ─────────────────────────────────────────────────────────── */

function AccountCard({ acc, currency }: { acc: Account; currency: import('@/lib/data').Currency }) {
  const isCredit = acc.kind === 'credit';
  const used = isCredit && acc.limit ? Math.abs(acc.balance) : 0;
  const limit = acc.limit || 0;
  const usedRatio = isCredit && limit ? clamp(used / limit) : 0;

  const kindLabel: Record<string, string> = {
    bank: 'Banco', cash: 'Efectivo', savings: 'Ahorros', credit: 'Crédito',
  };

  return (
    <div className="cd-card" style={{
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* radial glow */}
      <div style={{
        position: 'absolute',
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle, color-mix(in oklab, ${acc.color} 30%, transparent) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <AccountGlyph acc={acc} size={36} />
        <span style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--text-3)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 99,
          padding: '3px 9px',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}>
          {kindLabel[acc.kind]}
        </span>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 2,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {acc.name}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
          {acc.tail ? acc.tail : kindLabel[acc.kind]}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <MoneyText
          amount={Math.abs(acc.balance)}
          currency={currency}
          size={22}
          weight={700}
          type={isCredit ? 'expense' : undefined}
        />
        {isCredit && acc.limit && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Usado</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {pct(used, limit)}% · {fmtMoney(limit, currency)} límite
              </span>
            </div>
            <Bar ratio={usedRatio} color={acc.color} height={5} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { t, currency, lang } = useApp();
  const [period, setPeriod] = useState<Period>('month');

  const movs = filterMovs(MOVEMENTS, period);
  const { income, expense, net } = aggregate(movs);

  // savings = net of the period
  const savings = net;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Stats row header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>
            {t.netBalance}
          </div>
          <PeriodChips value={period} onChange={setPeriod} t={t} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="check" size={12} stroke={2} style={{ color: 'var(--income)' }} />
          {t.updated} 16:42
        </div>
      </div>

      {/* ── 4-card stats grid ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
        gap: 16,
      }}
        className="stats-grid"
      >
        {/* Hero card */}
        <HeroCard income={income} expense={expense} net={net} currency={currency} />

        {/* Ingresos */}
        <MiniStat
          icon="arrow-down"
          iconBg="var(--income-soft)"
          iconColor="var(--income)"
          label={t.income}
          amount={income}
          delta="+8.6% · 30d"
          positive
          currency={currency}
        />

        {/* Gastos */}
        <MiniStat
          icon="arrow-up"
          iconBg="var(--expense-soft)"
          iconColor="var(--expense)"
          label={t.expense}
          amount={expense}
          delta="+3.1% · 30d"
          positive={false}
          currency={currency}
        />

        {/* Ahorro */}
        <MiniStat
          icon="piggy"
          iconBg="rgba(91, 229, 209, 0.15)"
          iconColor="var(--cyan)"
          label={t.savings}
          amount={savings}
          delta={`${pct(savings, income)}% ${t.ofIncome}`}
          positive={savings >= 0}
          currency={currency}
        />
      </div>

      {/* ── Body row 1: Year evolution + Budgets ─────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: 16,
        alignItems: 'start',
      }}
        className="body-row"
      >
        <YearPanel currency={currency} />
        <BudgetsPanel currency={currency} lang={lang} />
      </div>

      {/* ── Body row 2: Recent + Category distribution ────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 16,
        alignItems: 'start',
      }}
        className="body-row"
      >
        <RecentPanel period={period} currency={currency} lang={lang} />
        <CategoryPanel period={period} currency={currency} lang={lang} />
      </div>

      {/* ── Accounts strip ────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {t.accountsTitle}
          </div>
          <Link href="/dashboard/cuentas" style={{
            fontSize: 12.5,
            color: 'var(--blue)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 500,
          }}>
            {t.seeAll}
            <Icon name="arrow-right" size={13} stroke={2} />
          </Link>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
        }}
          className="accounts-grid"
        >
          {ACCOUNTS.map(acc => (
            <AccountCard key={acc.id} acc={acc} currency={currency} />
          ))}
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .body-row { grid-template-columns: 1fr !important; }
          .accounts-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .accounts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
