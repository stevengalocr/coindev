'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { fmtMoney, type Account } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';
import { MoneyText } from '@/components/shell/MoneyText';
import { AccountGlyph } from '@/components/shell/CategoryGlyph';
import { AddAccountModal } from '@/components/screens/AddAccountModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

type SortKey = 'balance_desc' | 'balance_asc' | 'name' | 'type';

export default function CuentasPage() {
  const { t, lang } = useApp();
  const { accounts, movements, liveUsdRate, loading, deleteAccount } = useData();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Account | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('balance_desc');

  const SHOW_SEARCH = accounts.length >= 4;

  const total = accounts.reduce((s, a) => {
    const crc = (a.currency ?? 'CRC') === 'USD' ? a.balance * liveUsdRate : a.balance;
    return s + crc;
  }, 0);

  let filtered = query
    ? accounts.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
    : accounts;

  if (sort === 'balance_desc') filtered = [...filtered].sort((a, b) => b.balance - a.balance);
  else if (sort === 'balance_asc') filtered = [...filtered].sort((a, b) => a.balance - b.balance);
  else if (sort === 'name') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'type') filtered = [...filtered].sort((a, b) => a.kind.localeCompare(b.kind));

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAccount(deleteTarget.id);
      toast(lang === 'es' ? 'Cuenta eliminada' : 'Account deleted', 'info');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-enter">
      {menuId !== null && (
        <div onClick={() => setMenuId(null)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title={lang === 'es' ? 'Eliminar cuenta' : 'Delete account'}
        message={lang === 'es'
          ? `¿Eliminar la cuenta "${deleteTarget?.name}"? Se perderán todos sus movimientos asociados.`
          : `Delete account "${deleteTarget?.name}"? All associated transactions will be lost.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        lang={lang}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            {t.accountsTitle}
          </h1>
          {!loading && accounts.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                {t.netBalance}
              </span>
              <MoneyText amount={total} currency="CRC" size={24} weight={600} />
            </div>
          )}
          {loading && <div style={{ marginTop: 6, height: 18, width: 140, borderRadius: 4, background: 'var(--surface-3)' }} />}
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{ padding: '9px 16px 9px 12px', borderRadius: 10, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="plus" size={15} stroke={2.4} /> {t.addAccount}
        </button>
      </div>

      {/* Smart search + sort — only when 4+ accounts */}
      {!loading && SHOW_SEARCH && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', flex: 1, minWidth: 180, maxWidth: 320, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <Icon name="search" size={14} style={{ color: 'var(--text-3)' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={lang === 'es' ? 'Buscar cuenta…' : 'Search account…'} style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', fontSize: 13 }} />
            {query && <button onClick={() => setQuery('')} style={{ color: 'var(--text-3)' }}><Icon name="x" size={13} /></button>}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12.5 }}>
            <option value="balance_desc">{lang === 'es' ? 'Mayor saldo' : 'Highest balance'}</option>
            <option value="balance_asc">{lang === 'es' ? 'Menor saldo' : 'Lowest balance'}</option>
            <option value="name">{lang === 'es' ? 'Nombre A–Z' : 'Name A–Z'}</option>
            <option value="type">{lang === 'es' ? 'Tipo' : 'Type'}</option>
          </select>
        </div>
      )}

      {/* States */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="cd-card" style={{ padding: '20px 22px', minHeight: 160, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface-3)', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ height: 14, width: '60%', borderRadius: 4, background: 'var(--surface-3)' }} />
                  <div style={{ height: 11, width: '40%', borderRadius: 4, background: 'var(--surface-3)' }} />
                </div>
              </div>
              <div style={{ height: 28, width: '50%', borderRadius: 6, background: 'var(--surface-3)' }} />
              <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', marginTop: 'auto' }} />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="cd-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
            <Icon name="bank" size={26} stroke={1.6} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {lang === 'es' ? 'Sin cuentas todavía' : 'No accounts yet'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 300, margin: '0 auto 20px' }}>
            {lang === 'es'
              ? 'Agrega tu cuenta de banco, tarjeta o efectivo para empezar a registrar tus finanzas.'
              : 'Add your bank account, card or cash to start tracking your finances.'}
          </div>
          <button onClick={() => setAddOpen(true)} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} stroke={2.4} />
            {lang === 'es' ? 'Agregar cuenta' : 'Add account'}
          </button>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(acc => (
            <AccountCard
              key={acc.id}
              acc={acc}
              lang={lang}
              t={t}
              recent={movements.filter(m => m.account === acc.id).slice(0, 3)}
              menuId={menuId}
              onMenuToggle={(id) => setMenuId(menuId === id ? null : id)}
              onEdit={(a) => { setEditItem(a); setMenuId(null); }}
              onDelete={(a) => { setDeleteTarget(a); setMenuId(null); }}
            />
          ))}
          {/* Add card */}
          <button
            onClick={() => setAddOpen(true)}
            style={{
              padding: '28px 20px', borderRadius: 20, background: 'transparent',
              border: '1.5px dashed var(--border-strong)', color: 'var(--text-3)',
              fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, cursor: 'pointer', minHeight: 140,
              transition: 'border-color 150ms, color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-3)'; e.currentTarget.style.color = 'var(--text-2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            <Icon name="plus" size={16} stroke={1.8} /> {t.addAccount}
          </button>
        </div>
      )}

      <AddAccountModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => toast(lang === 'es' ? 'Cuenta creada' : 'Account created')}
      />
      <AddAccountModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSuccess={() => toast(lang === 'es' ? 'Cuenta actualizada' : 'Account updated')}
        initialData={editItem ?? undefined}
      />
    </div>
  );
}

function AccountCard({ acc, lang, t, recent, menuId, onMenuToggle, onEdit, onDelete }: {
  acc: Account; lang: string; t: any;
  recent: import('@/lib/data').Movement[];
  menuId: string | null;
  onMenuToggle: (id: string) => void;
  onEdit: (acc: Account) => void;
  onDelete: (acc: Account) => void;
}) {
  const isCredit = acc.kind === 'credit';
  const used = isCredit ? Math.abs(acc.balance) : 0;
  const pct = isCredit && acc.limit ? (used / acc.limit) * 100 : 0;

  return (
    <div className="cd-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      {/* Color glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90,
        background: `radial-gradient(circle, color-mix(in oklab, ${acc.color} 40%, transparent), transparent 70%)`,
        opacity: 0.25, pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative' }}>
        {/* Account name & type */}
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
          <div style={{ position: 'relative' }}>
            <button onClick={e => { e.stopPropagation(); onMenuToggle(acc.id); }} style={{ color: 'var(--text-3)', padding: 4, flexShrink: 0 }}>
              <Icon name="more" size={16} />
            </button>
            {menuId === acc.id && (
              <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-pop)', minWidth: 160, overflow: 'hidden' }}>
                <button onClick={e => { e.stopPropagation(); onEdit(acc); }} style={{ width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text)', fontWeight: 500, textAlign: 'left', background: 'transparent', borderBottom: '1px solid var(--border)' }}>
                  <Icon name="edit" size={15} /> {lang === 'es' ? 'Editar' : 'Edit'}
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete(acc); }} style={{ width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--expense)', fontWeight: 500, textAlign: 'left', background: 'transparent' }}>
                  <Icon name="trash" size={15} /> {lang === 'es' ? 'Eliminar' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Balance */}
        <MoneyText
          amount={Math.abs(acc.balance)}
          currency={acc.currency ?? 'CRC'}
          size={26}
          weight={600}
          style={{ color: acc.balance < 0 ? 'var(--expense)' : 'var(--text)' }}
        />

        {/* Credit limit bar */}
        {isCredit && acc.limit && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>
              <span>{lang === 'es' ? 'Utilizado' : 'Used'}</span>
              <span className="mono">{fmtMoney(used, acc.currency ?? 'CRC')} / {fmtMoney(acc.limit, acc.currency ?? 'CRC')}</span>
            </div>
            <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pct > 80 ? 'var(--expense)' : pct > 60 ? 'var(--warn)' : acc.color, borderRadius: 999, transition: 'width 600ms ease' }} />
            </div>
          </div>
        )}

        {/* Recent transactions */}
        {recent.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            {recent.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: 'var(--text-2)', borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{m.desc}</span>
                <span className="mono" style={{ fontSize: 11.5, color: m.type === 'income' ? 'var(--income)' : 'var(--expense)', fontWeight: 600, flexShrink: 0 }}>
                  {m.type === 'income' ? '+' : '−'}{fmtMoney(m.amount, acc.currency ?? 'CRC')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Contextual nav → see all movements for this account */}
        <Link
          href={`/dashboard/movimientos?account=${acc.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: 12, color: 'var(--blue)', textDecoration: 'none', fontWeight: 500 }}
        >
          {lang === 'es' ? 'Ver movimientos' : 'View transactions'}
          <Icon name="arrow-right" size={12} stroke={2} />
        </Link>
      </div>
    </div>
  );
}
