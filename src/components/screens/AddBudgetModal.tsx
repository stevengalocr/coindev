'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { CAT, CATEGORIES, LATAM_CURRENCIES, getCurrencyMeta } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: import('@/lib/data').Budget;
}

const EXPENSE_CATS = CATEGORIES.filter(c => c.type === 'expense');

export function AddBudgetModal({ open, onClose, onSuccess, initialData }: Props) {
  const { lang } = useApp();
  const { budgets, addBudget, updateBudget } = useData();
  const isEditing = !!initialData;

  const existingCats = new Set(budgets.map(b => b.cat));
  const available = EXPENSE_CATS.filter(c => !existingCats.has(c.id));

  const [cat, setCat] = useState(initialData?.cat ?? available[0]?.id ?? '');
  const [limit, setLimit] = useState(initialData?.limit.toString() ?? '');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'CRC');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setCat(initialData.cat);
      setLimit(initialData.limit.toString());
      setCurrency(initialData.currency ?? 'CRC');
    } else {
      setCat(available[0]?.id ?? '');
      setLimit('');
      setCurrency('CRC');
    }
    setError('');
  }, [open, initialData]);

  if (!open) return null;

  async function handleSave() {
    const amt = parseFloat(limit.replace(/,/g,''));
    if (!cat) { setError(lang === 'es' ? 'Elige una categoría.' : 'Choose a category.'); return; }
    if (!amt || amt <= 0) { setError(lang === 'es' ? 'Ingresa un límite válido.' : 'Enter a valid limit.'); return; }
    setSaving(true); setError('');
    try {
      if (isEditing) {
        await updateBudget(cat, amt);
      } else {
        await addBudget({ cat, limit_amount: amt, currency });
        setLimit(''); setCat(available[0]?.id ?? ''); setCurrency('CRC');
      }
      onClose();
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  const editCatInfo = isEditing ? CAT[initialData!.cat] : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto',
        background: 'var(--bg-2)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--border)',
        maxHeight: '85vh', overflowY: 'auto',
        animation: 'cd-slide-up 260ms cubic-bezier(0.2,0.8,0.2,1)',
      }} className="no-scrollbar">
        <style>{`@keyframes cd-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>
        <div style={{ padding: '16px 24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {isEditing
                ? (lang === 'es' ? 'Editar presupuesto' : 'Edit budget')
                : (lang === 'es' ? 'Nuevo presupuesto' : 'New budget')}
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4 }}><Icon name="x" size={18} /></button>
          </div>

          {isEditing ? (
            <>
              {/* Fixed category display */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {lang === 'es' ? 'Categoría' : 'Category'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1.5px solid var(--blue)' }}>
                  <CategoryGlyph id={initialData!.cat} size={36} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {editCatInfo?.[`label_${lang}` as 'label_es'] ?? initialData!.cat}
                  </span>
                </div>
              </div>

              {/* Límite */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {lang === 'es' ? 'Límite mensual' : 'Monthly limit'}
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-3)', pointerEvents: 'none' }}>{getCurrencyMeta(currency).symbol}</span>
                  <input
                    style={{
                      width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                      borderRadius: 'var(--r-md)', padding: '12px 14px 12px 28px',
                      color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
                      transition: 'border-color 150ms', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    placeholder={lang === 'es' ? 'Ej: 150000' : 'e.g. 150000'}
                    type="number" min="1"
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '9px 12px', borderRadius: 10, background: 'var(--expense-soft)', border: '1px solid rgba(255,107,131,0.2)', fontSize: 13, color: 'var(--expense)', marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <button onClick={handleSave} disabled={saving} style={{
                width: '100%', padding: '14px', borderRadius: 'var(--r-md)',
                background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)',
                fontSize: 14, fontWeight: 700, border: 0, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? (lang === 'es' ? 'Guardando…' : 'Saving…') : (lang === 'es' ? 'Guardar cambios' : 'Save changes')}
              </button>
            </>
          ) : available.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 13 }}>
              {lang === 'es' ? 'Ya tienes presupuesto en todas las categorías.' : 'You already have budgets for all categories.'}
            </div>
          ) : (
            <>
              {/* Categoría */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {lang === 'es' ? 'Categoría' : 'Category'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {available.map(c => (
                    <button key={c.id} onClick={() => setCat(c.id)} style={{
                      padding: '10px 8px', borderRadius: 'var(--r-md)',
                      border: `1.5px solid ${cat === c.id ? 'var(--blue)' : 'var(--border)'}`,
                      background: cat === c.id ? 'color-mix(in oklab, var(--blue) 10%, var(--surface))' : 'var(--surface)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 140ms',
                    }}>
                      <CategoryGlyph id={c.id} size={30} />
                      <span style={{ fontSize: 11, color: cat === c.id ? 'var(--text)' : 'var(--text-2)', fontWeight: cat === c.id ? 600 : 400 }}>
                        {lang === 'es' ? c.label_es : c.label_en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Moneda */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {lang === 'es' ? 'Moneda' : 'Currency'}
                </div>
                <div style={{ position: 'relative' }}>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                      borderRadius: 'var(--r-md)', padding: '11px 36px 11px 14px',
                      color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
                      transition: 'border-color 150ms', boxSizing: 'border-box',
                      appearance: 'none', cursor: 'pointer',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {LATAM_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code} style={{ background: '#10141F' }}>
                        {c.code} — {c.symbol} — {lang === 'es' ? c.name_es : c.name_en}
                      </option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue)' }}>{getCurrencyMeta(currency).symbol}</span>
                    <Icon name="chevron-down" size={13} style={{ color: 'var(--text-3)' }} />
                  </div>
                </div>
              </div>

              {/* Límite */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {lang === 'es' ? 'Límite mensual' : 'Monthly limit'}
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-3)', pointerEvents: 'none' }}>{getCurrencyMeta(currency).symbol}</span>
                  <input
                    style={{
                      width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                      borderRadius: 'var(--r-md)', padding: '12px 14px 12px 28px',
                      color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
                      transition: 'border-color 150ms', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    placeholder={lang === 'es' ? 'Ej: 150000' : 'e.g. 150000'}
                    type="number" min="1"
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '9px 12px', borderRadius: 10, background: 'var(--expense-soft)', border: '1px solid rgba(255,107,131,0.2)', fontSize: 13, color: 'var(--expense)', marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <button onClick={handleSave} disabled={saving} style={{
                width: '100%', padding: '14px', borderRadius: 'var(--r-md)',
                background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)',
                fontSize: 14, fontWeight: 700, border: 0, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? (lang === 'es' ? 'Guardando…' : 'Saving…') : (lang === 'es' ? 'Crear presupuesto' : 'Create budget')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
