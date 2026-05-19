'use client';

import { useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { Icon } from '@/components/ui/Icon';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: Props) {
  const { t, lang, currency, theme, setLang, setCurrency, setTheme } = useApp();

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <style>{`
        @keyframes cd-slide-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes cd-fade-bd { from { opacity: 0; } to { opacity: 1; } }
        .cd-sp-bd { animation: cd-fade-bd 180ms ease; }
        .cd-sp { animation: cd-slide-right 220ms cubic-bezier(0.2,0.8,0.2,1); }
      `}</style>

      {/* Backdrop */}
      <div className="cd-sp-bd" onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(3,6,15,0.65)',
        backdropFilter: 'blur(4px)',
      }} />

      {/* Panel */}
      <div className="cd-sp" style={{
        position: 'relative',
        width: 300,
        height: '100vh',
        background: 'var(--bg-2)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {t.settings}
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4, borderRadius: 8 }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="no-scrollbar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

            {/* Theme */}
            <SettingSection title={t.theme}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  { id: 'dark',  icon: 'moon' },
                  { id: 'light', icon: 'sun'  },
                ] as const).map(opt => {
                  const active = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      style={{
                        padding: '16px 12px',
                        borderRadius: 'var(--r-md)',
                        border: `1.5px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
                        background: active ? 'color-mix(in oklab, var(--blue) 11%, var(--surface))' : 'var(--surface)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        transition: 'all 140ms',
                      }}
                    >
                      <Icon name={opt.icon} size={20} style={{ color: active ? 'var(--blue)' : 'var(--text-3)' }} />
                      <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--text-3)' }}>
                        {opt.id === 'dark' ? t.dark : t.light}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SettingSection>

            {/* Language */}
            <SettingSection title={t.language}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  { id: 'es', flag: '🇨🇷', label: 'Español' },
                  { id: 'en', flag: '🇺🇸', label: 'English' },
                ] as const).map(opt => {
                  const active = lang === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setLang(opt.id)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--r-md)',
                        border: `1.5px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
                        background: active ? 'color-mix(in oklab, var(--blue) 11%, var(--surface))' : 'var(--surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontSize: 13, fontWeight: active ? 600 : 400,
                        color: active ? 'var(--text)' : 'var(--text-3)',
                        transition: 'all 140ms',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{opt.flag}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </SettingSection>

            {/* Currency */}
            <SettingSection title={t.mainCurrency}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  { id: 'CRC', symbol: '₡', sub: 'Colón CR' },
                  { id: 'USD', symbol: '$', sub: 'Dólar US' },
                ] as const).map(opt => {
                  const active = currency === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setCurrency(opt.id)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: 'var(--r-md)',
                        border: `1.5px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
                        background: active ? 'color-mix(in oklab, var(--blue) 11%, var(--surface))' : 'var(--surface)',
                        display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'all 140ms',
                      }}
                    >
                      <span className="mono" style={{ fontSize: 20, color: active ? 'var(--blue)' : 'var(--text-3)', fontWeight: 700, lineHeight: 1 }}>
                        {opt.symbol}
                      </span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--text-3)' }}>
                          {opt.id}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{opt.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SettingSection>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* User info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--gradient-hero)',
                display: 'grid', placeItems: 'center',
                fontSize: 16, fontWeight: 700, color: '#0C0E14', flexShrink: 0,
              }}>S</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Steven Castro</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>Plan Pro · CR</div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <button style={{
            width: '100%', padding: '11px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--expense)', fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 140ms',
          }}>
            <Icon name="arrow-left" size={15} stroke={2} />
            {t.signOut}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 11, color: 'var(--text-3)', fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}
