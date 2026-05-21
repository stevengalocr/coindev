'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { Icon } from '@/components/ui/Icon';
import { submitFeedback, type FeedbackType } from '@/lib/db';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPES: { id: FeedbackType; icon: string; label_es: string; label_en: string; color: string }[] = [
  { id: 'bug',     icon: 'bolt',  label_es: 'Error / Bug',  label_en: 'Bug',         color: '#EF4444' },
  { id: 'mejora',  icon: 'spark', label_es: 'Sugerencia',   label_en: 'Suggestion',  color: '#5B9BFF' },
  { id: 'consulta',icon: 'edit',  label_es: 'Consulta',     label_en: 'Question',    color: '#10B981' },
];

export function FeedbackModal({ open, onClose }: Props) {
  const { lang } = useApp();
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  function handleClose() {
    setTitle(''); setDescription(''); setType('bug'); setDone(false); setError('');
    onClose();
  }

  async function handleSend() {
    if (!title.trim() || !description.trim()) {
      setError(lang === 'es' ? 'Completa todos los campos.' : 'Fill in all fields.');
      return;
    }
    setSaving(true); setError('');
    try {
      await submitFeedback({ type, title: title.trim(), description: description.trim() });
      setDone(true);
    } catch {
      setError(lang === 'es' ? 'Error al enviar. Intenta de nuevo.' : 'Error sending. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto',
        background: 'var(--bg-2)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--border)', padding: '0 0 env(safe-area-inset-bottom,0)',
        maxHeight: '92vh', overflowY: 'auto',
      }} className="no-scrollbar">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>

        <div style={{ padding: '16px 24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {lang === 'es' ? 'Reportar / Sugerir' : 'Report / Suggest'}
            </div>
            <button onClick={handleClose} style={{ color: 'var(--text-3)', padding: 4 }}>
              <Icon name="x" size={18} />
            </button>
          </div>

          {done ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--income-soft)', margin: '0 auto 16px', display: 'grid', placeItems: 'center' }}>
                <Icon name="check" size={28} stroke={2.2} style={{ color: 'var(--income)' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                {lang === 'es' ? '¡Gracias por tu reporte!' : 'Thanks for your feedback!'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
                {lang === 'es' ? 'Lo revisaremos pronto.' : "We'll review it soon."}
              </div>
              <button onClick={handleClose} style={{ padding: '10px 28px', borderRadius: 12, background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)', fontSize: 13, fontWeight: 700, border: 0 }}>
                {lang === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
          ) : (
            <>
              {/* Type selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
                {TYPES.map(opt => (
                  <button key={opt.id} onClick={() => setType(opt.id)} style={{
                    padding: '12px 8px', borderRadius: 12, textAlign: 'center',
                    border: `1.5px solid ${type === opt.id ? opt.color : 'var(--border)'}`,
                    background: type === opt.id ? `color-mix(in oklab, ${opt.color} 10%, var(--surface))` : 'var(--surface)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    color: type === opt.id ? opt.color : 'var(--text-2)',
                    transition: 'all 140ms',
                  }}>
                    <Icon name={opt.icon} size={18} stroke={type === opt.id ? 2.2 : 1.6} />
                    <span style={{ fontSize: 12, fontWeight: type === opt.id ? 700 : 500, lineHeight: 1 }}>
                      {lang === 'es' ? opt.label_es : opt.label_en}
                    </span>
                  </button>
                ))}
              </div>

              {/* Title */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                  {lang === 'es' ? 'Título' : 'Title'}
                </div>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={lang === 'es' ? 'Describe brevemente el problema…' : 'Briefly describe the issue…'}
                  style={{
                    width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                    borderRadius: 10, padding: '11px 14px', color: 'var(--text)',
                    fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                  {lang === 'es' ? 'Detalle' : 'Details'}
                </div>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={lang === 'es' ? 'Explica con más detalle. ¿Qué pasó? ¿Qué esperabas que pasara?' : 'Explain in more detail. What happened? What did you expect?'}
                  rows={4}
                  style={{
                    width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                    borderRadius: 10, padding: '11px 14px', color: 'var(--text)', resize: 'vertical',
                    fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {error && (
                <div style={{ padding: '9px 12px', borderRadius: 10, background: 'var(--expense-soft)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--expense)', marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <button onClick={handleSend} disabled={saving} style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: 'var(--gradient-hero)', color: 'var(--btn-hero-text)',
                fontSize: 14, fontWeight: 700, border: 0,
                opacity: saving ? 0.7 : 1, transition: 'opacity 150ms',
              }}>
                {saving ? (lang === 'es' ? 'Enviando…' : 'Sending…') : (lang === 'es' ? 'Enviar reporte' : 'Send report')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
