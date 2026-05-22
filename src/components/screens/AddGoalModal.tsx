'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';
import { LATAM_CURRENCIES, getCurrencyMeta } from '@/lib/data';

const GOAL_ICONS = [
  { id: 'target',     label_es: 'Meta',        label_en: 'Goal',       color: '#3B82F6' },
  { id: 'home',       label_es: 'Vivienda',    label_en: 'Home',       color: '#EF4444' },
  { id: 'car',        label_es: 'Auto',        label_en: 'Car',        color: '#EAB308' },
  { id: 'plane',      label_es: 'Viaje',       label_en: 'Travel',     color: '#0D9488' },
  { id: 'phone',      label_es: 'Teléfono',    label_en: 'Phone',      color: '#0EA5E9' },
  { id: 'laptop',     label_es: 'Tecnología',  label_en: 'Tech',       color: '#8B5CF6' },
  { id: 'graduation', label_es: 'Educación',   label_en: 'Education',  color: '#06B6D4' },
  { id: 'ring',       label_es: 'Joyería',     label_en: 'Jewelry',    color: '#F472B6' },
  { id: 'umbrella',   label_es: 'Emergencia',  label_en: 'Emergency',  color: '#64748B' },
  { id: 'dumbbell',   label_es: 'Gimnasio',    label_en: 'Gym',        color: '#F97316' },
  { id: 'paw',        label_es: 'Mascota',     label_en: 'Pet',        color: '#84CC16' },
  { id: 'guitar',     label_es: 'Hobby',       label_en: 'Hobby',      color: '#A855F7' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: import('@/lib/data').SavingsGoal;
}

export function AddGoalModal({ open, onClose, onSuccess, initialData }: Props) {
  const { lang } = useApp();
  const { addGoal, updateGoal } = useData();
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [icon, setIcon] = useState(initialData?.icon ?? 'target');
  const [target, setTarget] = useState(initialData?.target.toString() ?? '');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'CRC');
  const [targetDate, setTargetDate] = useState(
    initialData?.targetDate ? initialData.targetDate.toISOString().slice(0, 10) : ''
  );
  const [status, setStatus] = useState<string>(initialData?.status ?? 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description ?? '');
      setIcon(initialData.icon);
      setTarget(initialData.target.toString());
      setCurrency(initialData.currency ?? 'CRC');
      setTargetDate(initialData.targetDate ? initialData.targetDate.toISOString().slice(0, 10) : '');
      setStatus(initialData.status);
    } else {
      setName('');
      setDescription('');
      setIcon('target');
      setTarget('');
      setCurrency('CRC');
      setTargetDate('');
      setStatus('active');
    }
    setError('');
    setSaving(false);
  }, [open, initialData]);

  if (!open) return null;

  async function handleSave() {
    if (!name.trim()) { setError(lang === 'es' ? 'Escribe el nombre de tu meta.' : 'Enter a goal name.'); return; }
    const amt = parseFloat(target.replace(/,/g,''));
    if (!amt || amt <= 0) { setError(lang === 'es' ? 'Ingresa un monto objetivo válido.' : 'Enter a valid target amount.'); return; }
    setSaving(true); setError('');
    try {
      if (isEditing && initialData) {
        await updateGoal(initialData.id, {
          name: name.trim(),
          description: description.trim() || null,
          icon,
          target_amount: amt,
          target_date: targetDate || null,
          status,
        });
      } else {
        await addGoal({
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          target_amount: amt,
          currency,
          target_date: targetDate || undefined,
        });
        setName(''); setDescription(''); setIcon('target'); setTarget(''); setTargetDate('');
      }
      onClose();
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  const statusOptions = [
    { id: 'active',    label_es: 'Activa',     label_en: 'Active'    },
    { id: 'paused',    label_es: 'Pausada',    label_en: 'Paused'    },
    { id: 'completed', label_es: 'Completada', label_en: 'Completed' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(4px)', cursor: 'pointer' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto',
        background: 'var(--bg-2)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--border)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }} className="cd-modal-sheet">
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 0 max(env(safe-area-inset-bottom, 0px), 16px)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>
        <div style={{ padding: '16px 24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {isEditing ? (lang === 'es' ? 'Editar meta' : 'Edit goal') : (lang === 'es' ? 'Nueva meta' : 'New goal')}
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4 }}><Icon name="x" size={18} /></button>
          </div>

          {/* Icono */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lang === 'es' ? 'Ícono' : 'Icon'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {GOAL_ICONS.map(ic => {
                const selected = icon === ic.id;
                return (
                  <button key={ic.id} onClick={() => setIcon(ic.id)} style={{
                    padding: '12px 8px 10px',
                    borderRadius: 'var(--r-md)',
                    border: `1.5px solid ${selected ? ic.color : 'var(--border)'}`,
                    background: selected ? `color-mix(in oklab, ${ic.color} 12%, var(--surface))` : 'var(--surface)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    cursor: 'pointer', transition: 'all 140ms',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: `color-mix(in oklab, ${ic.color} 18%, var(--surface-2))`,
                      display: 'grid', placeItems: 'center',
                      color: ic.color,
                    }}>
                      <Icon name={ic.id} size={18} stroke={1.7} />
                    </div>
                    <span style={{ fontSize: 11, color: selected ? 'var(--text)' : 'var(--text-2)', fontWeight: selected ? 600 : 400, lineHeight: 1.2, textAlign: 'center' }}>
                      {lang === 'es' ? ic.label_es : ic.label_en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nombre */}
          <GField label={lang === 'es' ? 'Nombre de la meta' : 'Goal name'}>
            <input
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor='var(--blue)'}
              onBlur={e => e.currentTarget.style.borderColor='var(--border)'}
              placeholder={lang === 'es' ? 'Ej: Viaje a Europa' : 'e.g. Europe trip'}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </GField>

          {/* Descripción */}
          <GField label={lang === 'es' ? 'Descripción (opcional)' : 'Description (optional)'}>
            <input
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor='var(--blue)'}
              onBlur={e => e.currentTarget.style.borderColor='var(--border)'}
              placeholder={lang === 'es' ? 'Para qué es esta meta…' : 'What is this goal for…'}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </GField>

          {/* Moneda */}
          <GField label={lang === 'es' ? 'Moneda' : 'Currency'}>
            <div style={{ position: 'relative' }}>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                onFocus={e => e.currentTarget.style.borderColor='var(--blue)'}
                onBlur={e => e.currentTarget.style.borderColor='var(--border)'}
                disabled={isEditing}
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
          </GField>

          {/* Monto objetivo */}
          <GField label={lang === 'es' ? 'Monto objetivo' : 'Target amount'}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-3)', pointerEvents: 'none' }}>{getCurrencyMeta(currency).symbol}</span>
              <input
                style={{ ...inputStyle, paddingLeft: 28 }}
                onFocus={e => e.currentTarget.style.borderColor='var(--blue)'}
                onBlur={e => e.currentTarget.style.borderColor='var(--border)'}
                placeholder="0"
                type="number" min="1"
                value={target}
                onChange={e => setTarget(e.target.value)}
              />
            </div>
          </GField>

          {/* Fecha objetivo */}
          <GField label={lang === 'es' ? 'Fecha objetivo (opcional)' : 'Target date (optional)'}>
            <input
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => e.currentTarget.style.borderColor='var(--blue)'}
              onBlur={e => e.currentTarget.style.borderColor='var(--border)'}
              type="date"
              min={new Date().toLocaleDateString('en-CA')}
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
            />
          </GField>

          {/* Status (only when editing) */}
          {isEditing && (
            <GField label={lang === 'es' ? 'Estado' : 'Status'}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {statusOptions.map(s => (
                  <button key={s.id} onClick={() => setStatus(s.id)} style={{
                    padding: '10px 8px', borderRadius: 'var(--r-md)',
                    border: `1.5px solid ${status === s.id ? 'var(--blue)' : 'var(--border)'}`,
                    background: status === s.id ? 'color-mix(in oklab, var(--blue) 10%, var(--surface))' : 'var(--surface)',
                    fontSize: 12, fontWeight: status === s.id ? 600 : 400,
                    color: status === s.id ? 'var(--text)' : 'var(--text-2)',
                    transition: 'all 140ms', cursor: 'pointer',
                  }}>
                    {lang === 'es' ? s.label_es : s.label_en}
                  </button>
                ))}
              </div>
            </GField>
          )}

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
            {saving
              ? (lang === 'es' ? 'Guardando…' : 'Saving…')
              : isEditing
                ? (lang === 'es' ? 'Guardar cambios' : 'Save changes')
                : (lang === 'es' ? 'Crear meta' : 'Create goal')}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border)',
  borderRadius: 'var(--r-md)', padding: '11px 14px', color: 'var(--text)',
  fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
  transition: 'border-color 150ms', boxSizing: 'border-box',
};

function GField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {children}
    </div>
  );
}
