'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { CAT, fmtMoney, type Movement } from '@/lib/data';
import { MoneyText } from '@/components/shell/MoneyText';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { Icon } from '@/components/ui/Icon';
import { AddMovementModal } from '@/components/screens/AddMovementModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { InfoModal } from '@/components/ui/InfoModal';
import { useToast } from '@/components/ui/Toast';

type SortKey = 'amount_desc' | 'amount_asc' | 'name' | 'next_due';

export default function GastosFijosPage() {
  const { t, lang } = useApp();
  const { movements, pendingMovements, accounts, liveUsdRate, loading, deleteTransaction } = useData();

  function getAccCurrency(accountId: string): string {
    return accounts.find(a => a.id === accountId)?.currency ?? 'CRC';
  }
  function toCRC(amount: number, currency: string): number {
    return currency === 'USD' ? amount * liveUsdRate : amount;
  }
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Movement | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sort, setSort] = useState<SortKey>('amount_desc');
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuId]);

  function nextDueDate(m: Movement): Date {
    const r = m.recurrence;
    const now = new Date();
    if (!r) return new Date(now.getFullYear(), now.getMonth() + 1, m.date.getDate());
    if (r.type === 'monthly') {
      const d = new Date(now.getFullYear(), now.getMonth(), r.value);
      if (d <= now) d.setMonth(d.getMonth() + 1);
      return d;
    }
    if (r.type === 'weekly') {
      const todayDay = now.getDay() === 0 ? 7 : now.getDay();
      let daysUntil = r.value - todayDay;
      if (daysUntil <= 0) daysUntil += 7;
      const d = new Date(now);
      d.setDate(now.getDate() + daysUntil);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return new Date(now.getTime() + r.value * 86400000);
  }

  function recurrenceLabel(m: Movement, lang: string): string {
    const r = m.recurrence;
    if (!r) {
      const nextDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, m.date.getDate());
      return (lang === 'es' ? 'Próximo pago' : 'Next due') + ' ' + nextDay.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'short' });
    }
    if (r.type === 'monthly') return lang === 'es' ? `Cada mes, día ${r.value}` : `Monthly, day ${r.value}`;
    if (r.type === 'custom') return lang === 'es' ? `Cada ${r.value} días` : `Every ${r.value} days`;
    if (r.type === 'weekly') {
      const days_es = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
      const days_en = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const d = lang === 'es' ? days_es[r.value] : days_en[r.value];
      return lang === 'es' ? `Cada ${d}` : `Every ${d}`;
    }
    return '';
  }

  const fixedMovs = pendingMovements.filter(m => m.fixed);
  const expenseMap: Record<string, typeof fixedMovs[0]> = {};
  const incomeMap: Record<string, typeof fixedMovs[0]> = {};
  fixedMovs.forEach(m => {
    if (m.type === 'expense' && !expenseMap[m.desc]) expenseMap[m.desc] = m;
    if (m.type === 'income' && !incomeMap[m.desc]) incomeMap[m.desc] = m;
  });
  let items = Object.values(expenseMap);
  const incomeItems = Object.values(incomeMap);

  if (sort === 'amount_desc') items = items.sort((a, b) => b.amount - a.amount);
  else if (sort === 'amount_asc') items = items.sort((a, b) => a.amount - b.amount);
  else if (sort === 'name') items = items.sort((a, b) => a.desc.localeCompare(b.desc));
  else if (sort === 'next_due') items = items.sort((a, b) => nextDueDate(a).getTime() - nextDueDate(b).getTime());

  const total = items.reduce((s, m) => s + toCRC(m.amount, getAccCurrency(m.account)), 0);
  const now = new Date();
  const monthIncome = movements
    .filter(m => m.type === 'income' && m.date.getFullYear() === now.getFullYear() && m.date.getMonth() === now.getMonth())
    .reduce((s, m) => s + toCRC(m.amount, getAccCurrency(m.account)), 0);
  const ratio = monthIncome > 0 ? total / monthIncome : 0;
  const perDay = total / 30;
  const ratioColor = ratio > 0.6 ? 'var(--expense)' : ratio > 0.45 ? 'var(--warn)' : 'var(--income)';

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteTarget.id, deleteTarget.type, deleteTarget.amount, deleteTarget.account);
      toast(lang === 'es' ? 'Gasto fijo eliminado' : 'Fixed expense deleted', 'info');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-enter">
      <ConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.type === 'income'
          ? (lang === 'es' ? 'Eliminar ingreso fijo' : 'Delete fixed income')
          : (lang === 'es' ? 'Eliminar gasto fijo' : 'Delete fixed expense')}
        message={lang === 'es'
          ? `¿Eliminar "${deleteTarget?.desc}"? Esta acción no se puede deshacer.`
          : `Delete "${deleteTarget?.desc}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        lang={lang}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>{t.fixedTitle}</h1>
            <button onClick={() => setInfoOpen(true)} style={{ color: 'var(--text-3)', display: 'flex', padding: 2, marginTop: 1 }} aria-label="Información">
              <Icon name="info" size={16} stroke={1.8} />
            </button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{t.fixedSubtitle}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {items.length >= 3 && (
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12.5 }}>
              <option value="amount_desc">{lang === 'es' ? 'Mayor monto' : 'Highest amount'}</option>
              <option value="amount_asc">{lang === 'es' ? 'Menor monto' : 'Lowest amount'}</option>
              <option value="name">{lang === 'es' ? 'Nombre A–Z' : 'Name A–Z'}</option>
              <option value="next_due">{lang === 'es' ? 'Próximo pago' : 'Next due'}</option>
            </select>
          )}
          <button onClick={() => setAddOpen(true)} style={{ padding: '9px 16px 9px 12px', borderRadius: 10, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={15} stroke={2.4} /> {lang === 'es' ? 'Nuevo recurrente' : 'New recurring'}
          </button>
        </div>
      </div>

      <InfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        lang={lang}
        title_es="Gastos e ingresos fijos"
        title_en="Fixed income & expenses"
        items={[
          { icon: 'shield', text_es: 'Aquí se agrupan todos los movimientos marcados como recurrentes: salario, alquiler, suscripciones, etc.', text_en: 'Here you can see all movements marked as recurring: salary, rent, subscriptions, etc.' },
          { icon: 'cal',    text_es: 'Te ayudan a planificar tu flujo mensual ya que son montos que se repiten con cierta frecuencia.', text_en: 'They help you plan your monthly cash flow as they are amounts that repeat at a certain frequency.' },
          { icon: 'plus',   text_es: 'Agrega nuevos recurrentes con el botón "Nuevo recurrente" y activa la opción de recurrencia en el formulario.', text_en: 'Add new recurring items with the "New recurring" button and enable the recurrence option in the form.' },
        ]}
      />
      <AddMovementModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => toast(lang === 'es' ? 'Movimiento guardado' : 'Saved')}
        initialFixed
      />
      <AddMovementModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSuccess={() => toast(lang === 'es' ? 'Movimiento actualizado' : 'Updated')}
        initialData={editItem ?? undefined}
      />

      {/* Fixed incomes section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: 2 }}>
            {lang === 'es' ? 'Ingresos fijos' : 'Fixed income'}
          </div>
        </div>
        {incomeItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incomeItems.map(m => {
              const c = CAT[m.cat];
              const accCur = getAccCurrency(m.account);
              return (
                <div key={m.id} className="cd-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '3px solid var(--income)', position: 'relative', zIndex: menuId === m.id ? 52 : 'auto' }}>
                  <CategoryGlyph id={m.cat} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{m.desc}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>
                      {c?.[`label_${lang}` as 'label_es']} ·{' '}
                      <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>
                        {recurrenceLabel(m, lang)}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <MoneyText amount={m.amount} currency={accCur} size={15} weight={600} type="income" />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuId(menuId === m.id ? null : m.id); }}
                      style={{ color: 'var(--text-3)', marginLeft: 4, padding: 8 }}
                    >
                      <Icon name="more" size={15} />
                    </button>
                    {menuId === m.id && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-pop)', minWidth: 160, overflow: 'hidden' }}>
                        <button onClick={e => { e.stopPropagation(); setEditItem(m); setMenuId(null); }} style={{ width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text)', fontWeight: 500, textAlign: 'left', background: 'transparent', borderBottom: '1px solid var(--border)' }}>
                          <Icon name="edit" size={15} /> {lang === 'es' ? 'Editar' : 'Edit'}
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(m); setMenuId(null); }} style={{ width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--expense)', fontWeight: 500, textAlign: 'left', background: 'transparent' }}>
                          <Icon name="trash" size={15} /> {lang === 'es' ? 'Eliminar' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loading && incomeItems.length === 0 && (
          <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
            {lang === 'es' ? 'Sin ingresos fijos registrados' : 'No fixed income yet'}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} className="cd-card" style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface-3)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 14, width: '45%', borderRadius: 4, background: 'var(--surface-3)' }} />
                <div style={{ height: 11, width: '30%', borderRadius: 4, background: 'var(--surface-3)' }} />
              </div>
              <div style={{ height: 16, width: 70, borderRadius: 4, background: 'var(--surface-3)' }} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="cd-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--text-3)' }}>
            <Icon name="shield" size={26} stroke={1.6} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {lang === 'es' ? 'Sin gastos fijos' : 'No fixed expenses'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 300, margin: '0 auto 20px' }}>
            {lang === 'es' ? 'Registra tus gastos recurrentes como alquiler, suscripciones y servicios.' : 'Record your recurring expenses like rent, subscriptions and services.'}
          </div>
          <button onClick={() => setAddOpen(true)} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} stroke={2.4} />
            {lang === 'es' ? 'Agregar gasto fijo' : 'Add fixed expense'}
          </button>
        </div>
      ) : (
        <>
          <div className="cd-card" style={{ padding: '22px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 100% 0%, color-mix(in oklab, var(--violet) 22%, transparent), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 4 }}>{t.monthly}</div>
              <MoneyText amount={total} currency="CRC" size={36} weight={600} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t.perDay}</div>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{fmtMoney(perDay, 'CRC')}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{t.ofIncome}</div>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: ratioColor }}>{Math.round(ratio * 100)}%</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{lang === 'es' ? 'Compromisos' : 'Commitments'}</div>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{items.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(m => {
              const c = CAT[m.cat];
              const accCur = getAccCurrency(m.account);
              return (
                <div key={m.id} className="cd-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 150ms', position: 'relative', zIndex: menuId === m.id ? 52 : 'auto' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <CategoryGlyph id={m.cat} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{m.desc}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>
                      {c?.[`label_${lang}` as 'label_es']} ·{' '}
                      <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>
                        {recurrenceLabel(m, lang)}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <MoneyText amount={m.amount} currency={accCur} size={15} weight={600} />
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{fmtMoney(m.amount / 30, accCur)}/d</div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuId(menuId === m.id ? null : m.id); }}
                      style={{ color: 'var(--text-3)', marginLeft: 4, padding: 8 }}
                    >
                      <Icon name="more" size={15} />
                    </button>
                    {menuId === m.id && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-pop)', minWidth: 160, overflow: 'hidden' }}>
                        <button onClick={e => { e.stopPropagation(); setEditItem(m); setMenuId(null); }} style={{ width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text)', fontWeight: 500, textAlign: 'left', background: 'transparent', borderBottom: '1px solid var(--border)' }}>
                          <Icon name="edit" size={15} /> {lang === 'es' ? 'Editar' : 'Edit'}
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(m); setMenuId(null); }} style={{ width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--expense)', fontWeight: 500, textAlign: 'left', background: 'transparent' }}>
                          <Icon name="trash" size={15} /> {lang === 'es' ? 'Eliminar' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
