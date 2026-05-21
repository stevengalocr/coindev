'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem { id: number; type: ToastType; message: string; }
interface ToastCtx { toast: (message: string, type?: ToastType) => void; }

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const colors: Record<ToastType, string> = {
    success: 'var(--income)',
    error: 'var(--expense)',
    info: 'var(--blue)',
  };
  const icons: Record<ToastType, string> = { success: 'check', error: 'x', info: 'bell' };

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 100, right: 20, zIndex: 600,
        display: 'flex', flexDirection: 'column-reverse', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 14, fontSize: 13.5, fontWeight: 500,
            background: 'var(--surface)', border: `1px solid color-mix(in oklab, ${colors[t.type]} 40%, var(--border))`,
            color: 'var(--text)', boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
            animation: 'toast-in 250ms cubic-bezier(0.2,0.8,0.2,1)',
            maxWidth: 320, minWidth: 200, pointerEvents: 'auto',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7, flexShrink: 0,
              background: `color-mix(in oklab, ${colors[t.type]} 18%, transparent)`,
              display: 'grid', placeItems: 'center', color: colors[t.type],
            }}>
              <Icon name={icons[t.type]} size={13} stroke={2.5} />
            </div>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes toast-in { from { transform: translateX(16px); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx.toast;
}
