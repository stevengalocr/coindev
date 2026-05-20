'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';

const GOAL_ICONS = ['target','home','car','plane','phone','laptop','graduation','ring','umbrella','dumbbell','paw','guitar'];

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: import('@/lib/data').SavingsGoal;
}

export function AddGoalModal({ open, onClose, initialData }: Props) {
  const { lang } = useApp();
  const { addGoal, updateGoal } = useData();
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [icon, setIcon] = useState(initialData?.icon ?? 'target');
  const [target, setTarget] = useState(initialData?.target.toString() ?? '');
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
      setTargetDate(initialData.targetDate ? initialData.targetDate.toISOString().slice(0, 10) : '');
      setStatus(initialData.status);
    } else {
      setName('');
      setDescription('');
      setIcon('target');
      setTarget('');
      setTargetDate('');
      setStatus('active');
    }
    setError('');
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
          target_date: targetDate || undefined,
        });
        setName(''); setDescription(''); setIcon('target'); setTarget(''); setTargetDate('');
      }
      onClose();
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
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto',
        background: 'var(--bg-2)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--border)',
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'cd-slide-up 260ms cubic-bezier(0.2,0.8,0.2,1)',
      }} className="no-scrollbar">
        <style>{`@keyframes cd-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GOAL_ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)} style={{
                  width: 44, height: 44, borderRadius: 12,
                  border: `1.5px solid ${icon === ic ? 'var(--blue)' : 'var(--border)'}`,
                  background: icon === ic ? 'color-mix(in oklab, var(--blue) 10%, var(--surface))' : 'var(--surface)',
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                  color: icon === ic ? 'var(--blue)' : 'var(--text-3)',
                  transition: 'all 120ms',
                }}>
                  <Icon name={ic} size={18} stroke={1.7} />
                </button>
              ))}
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

          {/* Monto objetivo */}
          <GField label={lang === 'es' ? 'Monto objetivo' : 'Target amount'}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-3)', pointerEvents: 'none' }}>₡</span>
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

          {/* Fecha límite */}
          <GField label={lang === 'es' ? 'Fecha objetivo (opcional)' : 'Target date (optional)'}>
            <input
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor='var(--blue)'}
              onBlur={e => e.currentTarget.style.borderColor='var(--border)'}
              type="date"
              min={new Date().toISOString().slice(0,10)}
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
            background: 'var(--gradient-hero)', color: '#0A0F1C',
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
