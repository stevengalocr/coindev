'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { CATEGORIES, getCurrencyMeta } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialFixed?: boolean;
  initialType?: 'expense' | 'income';
  initialData?: import('@/lib/data').Movement;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function AddMovementModal({ open, onClose, onSuccess, initialFixed = false, initialType = 'expense', initialData }: Props) {
  const { t, lang } = useApp();
  const { accounts, pendingMovements, addTransaction, updateTransaction } = useData();
  const isEditing = !!initialData;

  const [type, setType] = useState<'expense' | 'income'>(initialData?.type ?? initialType);
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  const [cat, setCat] = useState(initialData?.cat ?? (initialType === 'income' ? 'salary' : 'groceries'));
  const [accId, setAccId] = useState(initialData?.account ?? '');
  const [desc, setDesc] = useState(initialData?.desc ?? '');
  const [fixed, setFixed] = useState(initialData?.fixed ?? initialFixed);
  const [date, setDate] = useState(initialData ? toLocalDateStr(initialData.date) : toLocalDateStr(new Date()));
  const [recType, setRecType] = useState<'monthly' | 'weekly' | 'custom' | null>(initialData?.recurrence?.type ?? null);
  const [recValue, setRecValue] = useState<number>(initialData?.recurrence?.value ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accounts.length > 0 && !accId && !initialData) setAccId(accounts[0].id);
  }, [accounts, accId, initialData]);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setType(initialData.type);
      setAmount(String(initialData.amount));
      setCat(initialData.cat);
      setAccId(initialData.account);
      setDesc(initialData.desc);
      setFixed(initialData.fixed);
      setRecType(initialData.recurrence?.type ?? null);
      setRecValue(initialData.recurrence?.value ?? 1);
      setDate(toLocalDateStr(initialData.date));
    } else {
      setAmount('');
      setDesc('');
      setFixed(initialFixed);
      setRecType(null);
      setRecValue(1);
      setCat(initialType === 'income' ? 'salary' : 'groceries');
      setType(initialType);
      setDate(toLocalDateStr(new Date()));
    }
    setError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData, initialFixed, initialType]);

  useEffect(() => {
    if (isEditing || recType !== 'monthly') return;
    const today = new Date();
    const next = new Date(today.getFullYear(), today.getMonth(), recValue);
    if (next <= today) next.setMonth(next.getMonth() + 1);
    setDate(toLocalDateStr(next));
  }, [recType, recValue, isEditing]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const cats = CATEGORIES.filter(c => c.type === type);
  const selectedAcc = accounts.find(a => a.id === accId);
  const accCurrency = selectedAcc?.currency ?? 'CRC';
  const currencyMeta = getCurrencyMeta(accCurrency);
  const symbol = currencyMeta.symbol;

  async function handleSave() {
    const rawAmount = parseFloat(amount);
    if (!amount || amount === '0' || isNaN(rawAmount) || rawAmount <= 0) {
      setError(lang === 'es' ? 'Ingresa un monto válido.' : 'Enter a valid amount.');
      return;
    }
    if (!accId) { setError(lang === 'es' ? 'Selecciona una cuenta.' : 'Select an account.'); return; }
    // Require a name for fixed/recurring items to avoid "Sin descripción" duplicates
    if (fixed && !desc.trim()) {
      setError(lang === 'es' ? 'Escribe un nombre para el recurrente.' : 'Enter a name for the recurring item.');
      return;
    }
    // Prevent duplicate fixed-expense names (new items only; editing existing is allowed)
    if (fixed && !isEditing) {
      const trimmed = desc.trim().toLowerCase();
      const dupe = pendingMovements.find(m => m.fixed && m.desc.trim().toLowerCase() === trimmed);
      if (dupe) {
        setError(lang === 'es'
          ? `Ya tienes un gasto fijo llamado "${dupe.desc}". Usa un nombre diferente.`
          : `You already have a fixed expense called "${dupe.desc}". Use a different name.`);
        return;
      }
    }
    setSaving(true);
    setError('');
    try {
      if (isEditing && initialData) {
        await updateTransaction(
          initialData.id,
          { type, cat, amount: rawAmount, account_id: accId, date, description: desc || (lang === 'es' ? 'Sin descripción' : 'No description'), is_fixed: fixed, recurrence_type: fixed ? recType : null, recurrence_value: fixed && recType ? recValue : null },
          { type: initialData.type, amount: initialData.amount, account: initialData.account, date: toLocalDateStr(initialData.date) }
        );
      } else {
        await addTransaction({
          type,
          cat,
          amount: rawAmount,
          account_id: accId,
          date,
          description: desc || (lang === 'es' ? 'Sin descripción' : 'No description'),
          is_fixed: fixed,
          recurrence_type: fixed ? recType : null,
          recurrence_value: fixed && recType ? recValue : null,
        });
      }
      onClose();
      onSuccess?.();
    } catch {
      setError(lang === 'es' ? 'Error al guardar. Intenta de nuevo.' : 'Error saving. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(4px)', cursor: 'pointer' }} />

      {/* Sheet — animated wrapper, NOT scrollable (prevents iOS Safari scroll-on-transform bug) */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 520,
        background: 'var(--surface)', borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)', borderBottom: 0,
        boxShadow: 'var(--shadow-pop)', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }} className="cd-modal-sheet">

        {/* ── STICKY HEADER: handle + nav + type toggle ── */}
        <div style={{ flexShrink: 0, padding: '12px 20px 0' }}>
          <div style={{ display: 'grid', placeItems: 'center', marginBottom: 8 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {isEditing ? (lang === 'es' ? 'Editar movimiento' : 'Edit movement') : t.newMovement}
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4 }}><Icon name="x" size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'var(--surface-2)', borderRadius: 14, padding: 4, marginBottom: 12, border: '1px solid var(--border)' }}>
            {([{ id: 'expense', label: t.expenseType, color: 'var(--expense)' }, { id: 'income', label: t.incomeType, color: 'var(--income)' }] as const).map(opt => (
              <button key={opt.id} onClick={() => { setType(opt.id); setCat(opt.id === 'income' ? 'salary' : 'groceries'); }}
                style={{ padding: '9px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: type === opt.id ? '#0A0F1C' : 'var(--text-2)', background: type === opt.id ? opt.color : 'transparent', transition: 'all 150ms' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SCROLLABLE BODY: amount + keypad + category + fields + error ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 0' }} className="no-scrollbar">

          {/* No-accounts guard */}
          {accounts.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🏦</div>
              <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                {lang === 'es' ? 'Sin cuentas disponibles' : 'No accounts available'}
              </div>
              <div>{lang === 'es' ? 'Crea una cuenta antes de registrar movimientos.' : 'Create an account before adding transactions.'}</div>
            </div>
          )}

          {/* Amount */}
          <div style={{ textAlign: 'center', padding: '2px 0 8px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>{t.amount}</div>
            <div className="mono" style={{ marginTop: 6, fontSize: 42, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text)' }}>
              <span style={{ color: 'var(--text-3)' }}>{symbol}</span>
              <span>{amount || '0'}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>{accCurrency}</div>
          </div>

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 14 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(k => (
              <button key={k} className="cd-keypad-btn" onClick={() => {
                if (k === '⌫') setAmount(a => a.slice(0, -1));
                else if (k === '.' && amount.includes('.')) return;
                else setAmount(a => (a + k).slice(0, 12));
              }} style={{
                padding: '12px 0', borderRadius: 12,
                background: k === '⌫' ? 'var(--surface-3)' : 'var(--surface-2)',
                border: '1px solid var(--border)', color: 'var(--text)', fontSize: 19, fontWeight: 500,
                fontFamily: 'var(--font-mono)', transition: 'background 80ms, transform 80ms',
              }}>
                {k}
              </button>
            ))}
          </div>

          {/* Category */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>{t.category}</div>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
              {cats.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                  borderRadius: 999, whiteSpace: 'nowrap',
                  background: cat === c.id ? `color-mix(in oklab, ${c.color} 22%, transparent)` : 'var(--surface-2)',
                  border: `1px solid ${cat === c.id ? c.color : 'var(--border)'}`,
                  color: cat === c.id ? c.color : 'var(--text-2)', fontSize: 12.5, fontWeight: 500,
                }}>
                  <Icon name={c.glyph} size={13} stroke={1.8} />
                  {c[`label_${lang}` as 'label_es']}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="cd-card" style={{ padding: '2px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', minHeight: 46 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, width: 90, flexShrink: 0 }}>{t.account}</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <select value={accId} onChange={e => setAccId(e.target.value)} style={{ background: 'transparent', border: 0, color: 'var(--text)', fontSize: 13.5, fontWeight: 500, textAlign: 'right', appearance: 'none', outline: 'none', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
                  {accounts.map(a => <option key={a.id} value={a.id} style={{ background: '#10141F' }}>{a.name}</option>)}
                </select>
                <Icon name="chevron-down" size={14} style={{ color: 'var(--text-3)' }} />
              </div>
            </div>
            <div className="cd-divider" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', minHeight: 46 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, width: 90, flexShrink: 0 }}>{t.date}</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={{ background: 'transparent', border: 0, color: 'var(--text)', fontSize: 13.5, fontWeight: 500, textAlign: 'right', outline: 'none', fontFamily: 'var(--font-sans)', cursor: 'pointer', colorScheme: 'dark' }}
                />
              </div>
            </div>
            <div className="cd-divider" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', minHeight: 46 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, width: 90, flexShrink: 0 }}>{t.description}</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={t.descriptionHint} style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', fontSize: 13.5, fontWeight: 500, textAlign: 'right', fontFamily: 'var(--font-sans)', minWidth: 0 }} />
              </div>
            </div>
            <div className="cd-divider" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', minHeight: 46 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, width: 90, flexShrink: 0 }}>{t.recurring}</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                <button onClick={() => { setFixed(!fixed); if (fixed) setRecType(null); }} style={{ width: 46, height: 27, borderRadius: 14, position: 'relative', background: fixed ? 'var(--income)' : 'var(--surface-3)', transition: 'background 150ms', border: 0 }}>
                  <span style={{ position: 'absolute', top: 3.5, left: fixed ? 23 : 3.5, width: 20, height: 20, borderRadius: 10, background: fixed ? '#0A0F1C' : 'var(--text-3)', transition: 'left 180ms cubic-bezier(0.2,0.7,0.2,1)', display: 'block' }} />
                </button>
              </div>
            </div>

            {fixed && (
              <>
                <div className="cd-divider" />
                <div style={{ padding: '12px 0' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 9 }}>
                    {lang === 'es' ? 'Frecuencia de recurrencia' : 'Recurrence frequency'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {([
                      { id: null,      label_es: 'Sin definir', label_en: 'Undefined' },
                      { id: 'monthly', label_es: 'Mensual',     label_en: 'Monthly'   },
                      { id: 'weekly',  label_es: 'Semanal',     label_en: 'Weekly'    },
                      { id: 'custom',  label_es: 'Cada N días', label_en: 'Every N d' },
                    ] as const).map(opt => (
                      <button key={String(opt.id)} onClick={() => setRecType(opt.id)} style={{
                        padding: '7px 4px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                        border: `1px solid ${recType === opt.id ? 'var(--blue)' : 'var(--border)'}`,
                        background: recType === opt.id ? 'color-mix(in oklab, var(--blue) 10%, var(--surface))' : 'var(--surface)',
                        color: recType === opt.id ? 'var(--text)' : 'var(--text-2)',
                        transition: 'all 130ms', cursor: 'pointer',
                      }}>
                        {lang === 'es' ? opt.label_es : opt.label_en}
                      </button>
                    ))}
                  </div>

                  {recType === 'monthly' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {lang === 'es' ? 'Día del mes:' : 'Day of month:'}
                      </span>
                      <select value={recValue} onChange={e => setRecValue(Number(e.target.value))} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none' }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d} style={{ background: '#10141F' }}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {recType === 'weekly' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {lang === 'es' ? 'Día:' : 'Day:'}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(lang === 'es'
                          ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
                          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                        ).map((d, i) => (
                          <button key={i} onClick={() => setRecValue(i)} style={{
                            width: 34, height: 30, borderRadius: 7, fontSize: 11, fontWeight: 500,
                            border: `1px solid ${recValue === i ? 'var(--blue)' : 'var(--border)'}`,
                            background: recValue === i ? 'color-mix(in oklab, var(--blue) 12%, var(--surface))' : 'var(--surface)',
                            color: recValue === i ? 'var(--text)' : 'var(--text-2)',
                          }}>{d}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recType === 'custom' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {lang === 'es' ? 'Cada' : 'Every'}
                      </span>
                      <input
                        type="number" min="1" max="365"
                        value={recValue}
                        onChange={e => setRecValue(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: 64, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {lang === 'es' ? 'días' : 'days'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {error && <p style={{ fontSize: 13, color: 'var(--expense)', marginBottom: 12, padding: '8px 12px', background: 'var(--expense-soft)', borderRadius: 8 }}>{error}</p>}
        </div>

        {/* ── STICKY FOOTER: save button ── */}
        <div className="cd-modal-footer">
          <button onClick={handleSave} disabled={!amount || amount === '0' || saving || accounts.length === 0} style={{
            width: '100%', padding: '15px 18px', borderRadius: 14,
            background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)',
            fontSize: 15, fontWeight: 600, letterSpacing: '0.01em',
            opacity: (!amount || amount === '0' || saving || accounts.length === 0) ? 0.5 : 1,
            transition: 'opacity 150ms',
          }}>
            {saving
              ? (lang === 'es' ? 'Guardando…' : 'Saving…')
              : isEditing
                ? (lang === 'es' ? 'Guardar cambios' : 'Save changes')
                : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
