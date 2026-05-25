'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_ICON: Record<string, string> = {
  fixed_due: 'cal',
  budget_alert: 'flag',
  goal_reached: 'spark',
  weekly_summary: 'chart',
  monthly_summary: 'chart',
};

function timeAgo(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (lang === 'es') {
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${days}d`;
  } else {
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}

export function NotificationsPanel({ open, onClose }: Props) {
  const { lang } = useApp();
  const { notifications, unreadNotifications, markAllRead, refetch } = useData();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (unreadNotifications > 0) {
      markAllRead();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    setTimeout(() => document.addEventListener('mousedown', handleClick), 0);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
    }}>
      <div
        ref={panelRef}
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: 'min(400px, 100vw)',
          background: 'var(--bg-2)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.3)',
          animation: 'slideInRight 200ms ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="bell" size={18} stroke={1.8} style={{ color: 'var(--cyan)' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {lang === 'es' ? 'Notificaciones' : 'Notifications'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--surface)',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              color: 'var(--text-3)',
            }}
          >
            <Icon name="x" size={14} stroke={2} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          {notifications.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 12, color: 'var(--text-3)',
            }}>
              <Icon name="bell" size={40} stroke={1.2} />
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                {lang === 'es' ? 'Sin notificaciones' : 'No notifications'}
              </div>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div key={n.id} style={{
                padding: '14px 20px',
                borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: n.is_read ? 'transparent' : 'color-mix(in oklab, var(--cyan) 4%, transparent)',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'color-mix(in oklab, var(--cyan) 12%, var(--surface-2))',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon name={TYPE_ICON[n.type] ?? 'bell'} size={15} stroke={1.8} style={{ color: 'var(--cyan)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                    {n.title}
                    {!n.is_read && (
                      <span style={{
                        display: 'inline-block', marginLeft: 6,
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--cyan)', verticalAlign: 'middle',
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
                    {timeAgo(n.created_at, lang)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
