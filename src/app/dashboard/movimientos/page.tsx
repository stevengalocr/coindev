'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { CAT, filterMovs, fmtMoney, type Period, type Movement } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { PeriodChips } from '@/components/shell/PeriodChips';
import { AddMovementModal } from '@/components/screens/AddMovementModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { InfoModal } from '@/components/ui/InfoModal';
import { useToast } from '@/components/ui/Toast';

type SortKey = 'date' | 'amount_desc' | 'amount_asc';

export default function MovimientosPage() {
  return (
    <Suspense>
      <MovimientosInner />
    </Suspense>
  );
}

function MovimientosInner() {
  const { t, lang } = useApp();
  const { movements, accounts, loading, deleteTransaction, liveUsdRate } = useData();
  const accCurrencyMap = Object.fromEntries(accounts.map(a => [a.id, a.currency ?? 'CRC']));
  const toCRC = (amount: number, cur: string) => cur === 'USD' ? amount * liveUsdRate : amount;
  const toast = useToast();
  const searchParams = useSearchParams();

  const [period, setPeriod] = useState<Period>('month');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('date');
  const [compact, setCompact] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Movement | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuId]);

  // Pick up ?q= or ?account= from URL (unified search / account deep-link)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
    const acc = searchParams.get('account');
    if (acc) {/* account filter could be added here – for now prefills search with account name */}
  }, [searchParams]);

  const periodMovs = filterMovs(movements, period);
  let list = periodMovs.filter(m => {
    if (filter !== 'all' && m.type !== filter) return false;
    if (query && !m.desc.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const hasActiveFilters = filter !== 'all' || !!query;

  if (sort === 'amount_desc') list = [...list].sort((a, b) => b.amount - a.amount);
  else if (sort === 'amount_asc') list = [...list].sort((a, b) => a.amount - b.amount);
  // 'date' keeps default (already sorted by date from filterMovs)

  const groups: Record<string, Movement[]> = {};
  list.forEach(m => {
    const k = m.date.toDateString();
    (groups[k] = groups[k] || []).push(m);
  });

  const total = list.reduce((s, m) => {
    const crc = toCRC(m.amount, accCurrencyMap[m.account] ?? 'CRC');
    return s + (m.type === 'expense' ? -crc : crc);
  }, 0);
  const todayMidnight = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  function daysAgo(d: Date): number {
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((todayMidnight.getTime() - local.getTime()) / 86400000);
  }

  function dayLabel(dateStr: string) {
    const date = new Date(dateStr);
    const diff = daysAgo(date);
    if (diff === 0) return t.today;
    if (diff === 1) return t.yesterday;
    return date.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id, deleteTarget.type, deleteTarget.amount, deleteTarget.account);
      toast(lang === 'es' ? 'Movimiento eliminado' : 'Transaction deleted', 'info');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <ConfirmModal
        open={!!deleteTarget}
        title={lang === 'es' ? 'Eliminar movimiento' : 'Delete transaction'}
        message={lang === 'es'
          ? `¿Eliminar "${deleteTarget?.desc}"? Esta acción no se puede deshacer.`
          : `Delete "${deleteTarget?.desc}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        lang={lang}
      />

      <div className="page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>{t.movements}</h1>
              <button onClick={() => setInfoOpen(true)} style={{ color: 'var(--text-3)', display: 'flex', padding: 2, marginTop: 1 }} aria-label="Información">
                <Icon name="info" size={16} stroke={1.8} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
              {list.length} {t.transactions}
              {list.length > 0 && <> · <span className="mono">{fmtMoney(total, 'CRC', { sign: true })}</span></>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Compact toggle — mobile only */}
            <button
              onClick={() => setCompact(v => !v)}
              title={compact ? (lang === 'es' ? 'Vista normal' : 'Normal view') : (lang === 'es' ? 'Vista compacta' : 'Compact view')}
              style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)', background: compact ? 'var(--surface-3)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}
              className="mobile-only"
            >
              <Icon name={compact ? 'list' : 'filter'} size={15} stroke={1.8} />
            </button>
            <button
              onClick={() => setAddOpen(true)}
              style={{ padding: '9px 16px 9px 12px', borderRadius: 10, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="plus" size={15} stroke={2.4} /> {t.newMovement}
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', flex: 1, minWidth: 180, maxWidth: 360, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <Icon name="search" size={15} style={{ color: 'var(--text-3)' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.searchMov} style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', fontSize: 13.5 }} />
            {query && <button onClick={() => setQuery('')} style={{ color: 'var(--text-3)' }}><Icon name="x" size={14} /></button>}
          </div>
          <PeriodChips value={period} onChange={setPeriod} t={t} />
          <div style={{ display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
            {(['all', 'income', 'expense'] as const).map(k => (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12.5,
                background: filter === k ? 'var(--surface-3)' : 'transparent',
                color: filter === k ? 'var(--text)' : 'var(--text-3)',
                fontWeight: 500, transition: 'all 120ms',
              }}>
                {k === 'all' ? t.all : k === 'income' ? t.income : t.expense}
              </button>
            ))}
          </div>
          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12.5, cursor: 'pointer' }}
          >
            <option value="date">{lang === 'es' ? 'Fecha' : 'Date'}</option>
            <option value="amount_desc">{lang === 'es' ? 'Mayor monto' : 'Highest amount'}</option>
            <option value="amount_asc">{lang === 'es' ? 'Menor monto' : 'Lowest amount'}</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} className="cd-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2].map(j => (
                  <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-3)', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ height: 13, borderRadius: 4, background: 'var(--surface-3)', width: '55%' }} />
                      <div style={{ height: 10, borderRadius: 4, background: 'var(--surface-3)', width: '35%' }} />
                    </div>
                    <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-3)', width: 60 }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : Object.entries(groups).length === 0 ? (
          <div className="cd-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
              <Icon name={hasActiveFilters ? 'search' : 'list'} size={26} stroke={1.6} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {hasActiveFilters
                ? (lang === 'es' ? 'Sin resultados' : 'No results')
                : (lang === 'es' ? 'Sin movimientos' : 'No transactions')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 300, margin: '0 auto 20px' }}>
              {hasActiveFilters
                ? (lang === 'es' ? 'Ningún movimiento coincide con tu búsqueda o filtros activos.' : 'No transactions match your search or active filters.')
                : (lang === 'es' ? 'Registra tu primer ingreso o gasto para empezar a ver tu historial.' : 'Record your first income or expense to start seeing your history.')}
            </div>
            {hasActiveFilters ? (
              <button onClick={() => { setQuery(''); setFilter('all'); }} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="x" size={14} stroke={2} />
                {lang === 'es' ? 'Limpiar filtros' : 'Clear filters'}
              </button>
            ) : (
              <button onClick={() => setAddOpen(true)} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="plus" size={14} stroke={2.4} />
                {lang === 'es' ? 'Agregar movimiento' : 'Add transaction'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(groups).map(([day, items]) => {
              const daySum = items.reduce((s, m) => {
                const crc = toCRC(m.amount, accCurrencyMap[m.account] ?? 'CRC');
                return s + (m.type === 'expense' ? -crc : crc);
              }, 0);
              return (
                <div key={day}>
                  {sort === 'date' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px 8px', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{dayLabel(day)}</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{fmtMoney(daySum, 'CRC', { sign: true })}</span>
                    </div>
                  )}
                  <div className="cd-card" style={{ padding: compact ? 2 : 4 }}>
                    {items.map((m, i) => {
                      const c = CAT[m.cat];
                      const acc = accounts.find(a => a.id === m.account);
                      const diff = daysAgo(m.date);
                      const when = diff === 0 ? t.today : diff === 1 ? t.yesterday :
                        m.date.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'short' });
                      const rowContent = (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: compact ? 10 : 14,
                          padding: compact ? '8px 12px' : '11px 14px',
                          borderRadius: 10, transition: 'background 100ms', cursor: 'default',
                          position: 'relative',
                        }}>
                          <CategoryGlyph id={m.cat} size={compact ? 30 : 38} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: compact ? 12.5 : 13.5, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.desc}</span>
                              {m.fixed && <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--violet)', flexShrink: 0 }} />}
                            </div>
                            {!compact && (
                              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                                {c?.[`label_${lang}` as 'label_es']} · {acc?.name ?? '—'} · {when}
                              </div>
                            )}
                          </div>
                          <MoneyText amount={m.amount} currency={accCurrencyMap[m.account] ?? 'CRC'} size={compact ? 12.5 : 13.5} weight={600} sign type={m.type} />
                          {/* Three-dot menu — desktop only */}
                          <div style={{ position: 'relative', zIndex: menuId === m.id ? 52 : 'auto' }} className="desktop-only">
                            <button
                              onClick={e => { e.stopPropagation(); setMenuId(menuId === m.id ? null : m.id); }}
                              style={{ color: 'var(--text-3)', padding: 6 }}
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
                                <button onClick={e => { e.stopPropagation(); setDeleteTarget(m); setMenuId(null); }} style={{
                                  width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                                  fontSize: 13.5, color: 'var(--expense)', fontWeight: 500, textAlign: 'left',
                                  background: 'transparent',
                                }}>
                                  <Icon name="trash" size={15} /> {lang === 'es' ? 'Eliminar' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <div key={m.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          {/* Mobile: swipeable row */}
                          <div className="mobile-only" style={{ display: 'none' }}>
                            <SwipeableRow
                              actions={[
                                {
                                  label: lang === 'es' ? 'Editar' : 'Edit',
                                  icon: <Icon name="edit" size={18} />,
                                  color: '#fff',
                                  bg: 'var(--blue)',
                                  onClick: () => setEditItem(m),
                                },
                                {
                                  label: lang === 'es' ? 'Eliminar' : 'Delete',
                                  icon: <Icon name="trash" size={18} />,
                                  color: '#fff',
                                  bg: 'var(--expense)',
                                  onClick: () => setDeleteTarget(m),
                                },
                              ]}
                            >
                              {rowContent}
                            </SwipeableRow>
                          </div>
                          {/* Desktop: plain row */}
                          <div className="desktop-only">
                            {rowContent}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <InfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        lang={lang}
        title_es="Movimientos"
        title_en="Transactions"
        items={[
          { icon: 'list',       text_es: 'Aquí se registran todos tus ingresos y gastos organizados por fecha.', text_en: 'All your income and expenses are recorded here, organized by date.' },
          { icon: 'filter',     text_es: 'Usa los filtros de período, tipo (ingreso/gasto) o el buscador para encontrar cualquier movimiento.', text_en: 'Use the period, type or search filters to find any transaction.' },
          { icon: 'more',       text_es: 'Pulsa el menú de tres puntos en cualquier movimiento para editarlo o eliminarlo.', text_en: 'Tap the three-dot menu on any transaction to edit or delete it.' },
        ]}
      />
      <AddMovementModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => toast(lang === 'es' ? 'Movimiento guardado' : 'Transaction saved')}
      />
      <AddMovementModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSuccess={() => toast(lang === 'es' ? 'Movimiento actualizado' : 'Transaction updated')}
        initialData={editItem ?? undefined}
      />

      <style>{`
        .mobile-only { display: none !important; }
        .desktop-only { display: block; }
        @media (max-width: 768px) {
          .mobile-only { display: block !important; }
          .desktop-only { display: none !important; }
        }
      `}</style>
    </>
  );
}
