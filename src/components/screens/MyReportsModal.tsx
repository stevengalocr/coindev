'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { Icon } from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase';
import type { DbFeedback, FeedbackType } from '@/lib/db';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<FeedbackType, { es: string; en: string; color: string }> = {
  bug:      { es: 'Error',       en: 'Bug',        color: '#EF4444' },
  mejora:   { es: 'Sugerencia',  en: 'Suggestion', color: '#5B9BFF' },
  consulta: { es: 'Consulta',    en: 'Question',   color: '#10B981' },
};

const STATUS_LABELS: Record<string, { es: string; en: string; color: string; bg: string }> = {
  nuevo:       { es: 'Enviado',     en: 'Sent',        color: '#5B9BFF', bg: 'rgba(91,155,255,0.10)'  },
  en_revision: { es: 'En revisión', en: 'In review',   color: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  },
  resuelto:    { es: 'Resuelto',    en: 'Resolved',    color: '#10B981', bg: 'rgba(16,185,129,0.10)'  },
};

export function MyReportsModal({ open, onClose }: Props) {
  const { lang } = useApp();
  const [reports, setReports] = useState<DbFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const sb = createClient();
    sb.from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports((data ?? []) as DbFeedback[]);
        setLoading(false);
      });
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto',
        background: 'var(--bg-2)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--border)', padding: '0 0 env(safe-area-inset-bottom,0)',
        maxHeight: '88vh', overflowY: 'auto',
      }} className="no-scrollbar">

        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>

        <div style={{ padding: '16px 24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {lang === 'es' ? 'Mis reportes' : 'My reports'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {lang === 'es' ? 'Seguimiento de tus reportes y sugerencias' : 'Track your reports and suggestions'}
              </div>
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4 }}>
              <Icon name="x" size={18} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2].map(i => (
                <div key={i} style={{ height: 90, borderRadius: 14, background: 'var(--surface-3)' }} />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface-3)', margin: '0 auto 14px', display: 'grid', placeItems: 'center' }}>
                <Icon name="edit" size={22} stroke={1.6} style={{ color: 'var(--text-4)' }} />
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
                {lang === 'es' ? 'No has enviado reportes aún.' : "You haven't submitted any reports yet."}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports.map(r => {
                const typeInfo = TYPE_LABELS[r.type as FeedbackType];
                const statusInfo = STATUS_LABELS[r.status] ?? STATUS_LABELS.nuevo;
                const date = new Date(r.created_at).toLocaleDateString(
                  lang === 'es' ? 'es-CR' : 'en-US',
                  { day: 'numeric', month: 'short', year: 'numeric' }
                );
                return (
                  <div key={r.id} className="cd-card" style={{ padding: '16px 18px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: `color-mix(in oklab, ${typeInfo?.color ?? '#9CA3AF'} 12%, var(--surface-3))`,
                        display: 'grid', placeItems: 'center',
                      }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: typeInfo?.color ?? '#9CA3AF', letterSpacing: '0.02em' }}>
                          {(lang === 'es' ? typeInfo?.es : typeInfo?.en)?.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{date}</div>
                      </div>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                        color: statusInfo.color, background: statusInfo.bg,
                        padding: '3px 9px', borderRadius: 999,
                      }}>
                        {lang === 'es' ? statusInfo.es : statusInfo.en}
                      </span>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: r.admin_reply ? 12 : 0 }}>
                      {r.description}
                    </div>

                    {/* Admin reply */}
                    {r.admin_reply && (
                      <div style={{
                        marginTop: 4,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'color-mix(in oklab, var(--cyan) 8%, var(--surface-2))',
                        border: '1px solid color-mix(in oklab, var(--cyan) 20%, var(--border))',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <img src="/logo-64.png" alt="CoinDev" width={16} height={16} style={{ borderRadius: 4 }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.02em' }}>
                            {lang === 'es' ? 'Respuesta del equipo' : 'Team reply'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                          {r.admin_reply}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
