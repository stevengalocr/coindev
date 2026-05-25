'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

interface Section {
  label: string;
  items: NavItem[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  sections: Section[];
  unreadNotifications: number;
  onOpenNotifications: () => void;
  lang: string;
}

export function MobileMoreSheet({ open, onClose, sections, unreadNotifications, onOpenNotifications, lang }: Props) {
  const pathname = usePathname();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', left: 0, right: 0,
          bottom: 0,
          background: 'var(--bg-2)',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid var(--border)',
          padding: '12px 0 calc(20px + env(safe-area-inset-bottom, 0px))',
          animation: 'slideUp 220ms ease',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        className="no-scrollbar"
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 16px' }} />

        {/* Notifications row */}
        <button
          onClick={() => { onClose(); onOpenNotifications(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            padding: '13px 22px', background: 'transparent', border: 'none',
            textAlign: 'left', cursor: 'pointer',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: unreadNotifications > 0
              ? 'color-mix(in oklab, var(--expense) 14%, var(--surface-2))'
              : 'var(--surface-2)',
            border: `1px solid ${unreadNotifications > 0 ? 'color-mix(in oklab, var(--expense) 30%, var(--border))' : 'var(--border)'}`,
            display: 'grid', placeItems: 'center', position: 'relative',
          }}>
            <Icon name="bell" size={17} stroke={1.8}
              style={{ color: unreadNotifications > 0 ? 'var(--expense)' : 'var(--text-3)' }} />
            {unreadNotifications > 0 && (
              <div style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 16, height: 16, borderRadius: 999,
                background: 'var(--expense)', color: '#fff',
                fontSize: 9, fontWeight: 800,
                display: 'grid', placeItems: 'center',
                padding: '0 3px',
                border: '1.5px solid var(--bg-2)',
              }}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
              {lang === 'es' ? 'Notificaciones' : 'Notifications'}
            </div>
            {unreadNotifications > 0 && (
              <div style={{ fontSize: 11.5, color: 'var(--expense)', marginTop: 1 }}>
                {unreadNotifications} {lang === 'es' ? 'sin leer' : 'unread'}
              </div>
            )}
          </div>
        </button>

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 22px 4px' }} />

        {/* Nav sections */}
        {sections.map((section, si) => (
          <div key={si}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'var(--text-4)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '12px 22px 6px',
            }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 22px', textDecoration: 'none',
                    color: active ? 'var(--cyan)' : 'var(--text)',
                    background: active
                      ? 'color-mix(in oklab, var(--cyan) 7%, transparent)'
                      : 'transparent',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: active
                      ? 'color-mix(in oklab, var(--cyan) 14%, var(--surface-2))'
                      : 'var(--surface-2)',
                    border: `1px solid ${active ? 'color-mix(in oklab, var(--cyan) 30%, var(--border))' : 'var(--border)'}`,
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Icon name={item.icon} size={17} stroke={active ? 2.1 : 1.7}
                      style={{ color: active ? 'var(--cyan)' : 'var(--text-3)' }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>
                    {item.label}
                  </span>
                  {active && (
                    <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)' }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
