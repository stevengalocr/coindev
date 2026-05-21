'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';

interface Props { open: boolean; onClose: () => void }

export function SettingsPanel({ open, onClose }: Props) {
  const { t, lang, currency, theme, setLang, setCurrency, setTheme, signOut } = useApp();
  const { profile, saveProfile } = useData();

  const displayName = profile?.full_name ?? '';
  const nameParts = displayName.trim().split(' ');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(' ');
      setFirstName(parts[0] ?? '');
      setLastName(parts.slice(1).join(' ') ?? '');
    }
  }, [profile?.full_name]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  const currentName = [firstName, lastName].filter(Boolean).join(' ') || 'Usuario';
  const initials = currentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  async function handleTheme(val: 'dark' | 'light') {
    setTheme(val);
    await saveProfile({ theme: val });
  }

  async function handleLang(val: 'es' | 'en') {
    setLang(val);
    await saveProfile({ language: val });
  }

  async function handleCurrency(val: 'CRC' | 'USD') {
    setCurrency(val);
    await saveProfile({ default_currency: val });
  }

  async function handleSaveProfile() {
    const full_name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!full_name) return;
    setSavingProfile(true);
    try {
      await saveProfile({ full_name });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } finally {
      setSavingProfile(false);
    }
  }

  const profileDirty = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') !== (profile?.full_name ?? '');

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <style>{`
        @keyframes cd-slide-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes cd-fade-bd { from { opacity: 0; } to { opacity: 1; } }
        .cd-sp-bd { animation: cd-fade-bd 180ms ease; }
        .cd-sp { animation: cd-slide-right 220ms cubic-bezier(0.2,0.8,0.2,1); }
        .sp-input { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r-md); padding: 10px 12px; color: var(--text); font-size: 13.5px; font-family: var(--font-sans); width: 100%; outline: none; transition: border-color 150ms; box-sizing: border-box; }
        .sp-input:focus { border-color: var(--blue); }
        .sp-input::placeholder { color: var(--text-3); }
      `}</style>
      <div className="cd-sp-bd" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,6,15,0.65)', backdropFilter: 'blur(4px)' }} />
      <div className="cd-sp" style={{ position: 'relative', width: 320, height: '100vh', background: 'var(--bg-2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{t.settings}</div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', padding: 4, borderRadius: 8 }}><Icon name="x" size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="no-scrollbar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

            {/* Profile avatar + summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'var(--surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-hero)', display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 700, color: '#0C0E14', flexShrink: 0 }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentName}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                  {profile?.plan === 'pro' ? 'Plan Pro ✦' : 'Plan Free'} · {profile?.email ?? ''}
                </div>
              </div>
            </div>

            {/* Account / Profile edit */}
            <Section title={lang === 'es' ? 'Mi cuenta' : 'My account'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 5 }}>{lang === 'es' ? 'Nombre' : 'First name'}</div>
                    <input
                      className="sp-input"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder={lang === 'es' ? 'Tu nombre' : 'Your name'}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 5 }}>{lang === 'es' ? 'Apellido' : 'Last name'}</div>
                    <input
                      className="sp-input"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder={lang === 'es' ? 'Tu apellido' : 'Your last name'}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 5 }}>{lang === 'es' ? 'Correo electrónico' : 'Email'}</div>
                  <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email ?? '—'}</span>
                    <Icon name="eye-off" size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 5 }}>{lang === 'es' ? 'Plan' : 'Plan'}</div>
                  {(() => {
                    const status = profile?.plan_status ?? 'trial';
                    const isPro = profile?.plan === 'pro' || status === 'active';
                    const statusLabel: Record<string, string> = {
                      trial: lang === 'es' ? 'Prueba gratuita' : 'Free trial',
                      active: lang === 'es' ? 'Activo' : 'Active',
                      pending_payment: lang === 'es' ? 'Pago pendiente' : 'Payment pending',
                      blocked: lang === 'es' ? 'Suspendido' : 'Suspended',
                    };
                    const statusColor: Record<string, string> = {
                      trial: 'var(--blue)', active: 'var(--income)', pending_payment: '#F59E0B', blocked: 'var(--expense)',
                    };
                    return (
                      <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <span style={{ fontWeight: 500 }}>{isPro ? 'Pro' : 'Free'}</span>
                          <span style={{ fontSize: 11, marginLeft: 8, color: statusColor[status] ?? 'var(--text-3)' }}>
                            {statusLabel[status] ?? status}
                          </span>
                        </div>
                        {!isPro && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'color-mix(in oklab, var(--blue) 12%, transparent)', padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {lang === 'es' ? 'Mejorar' : 'Upgrade'}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={!profileDirty || savingProfile || !firstName.trim()}
                  style={{
                    padding: '11px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 600,
                    background: profileSaved ? 'var(--income-soft)' : (profileDirty && firstName.trim()) ? 'var(--gradient-hero)' : 'var(--surface-2)',
                    color: profileSaved ? 'var(--income)' : (profileDirty && firstName.trim()) ? '#0A0F1C' : 'var(--text-3)',
                    border: `1px solid ${profileSaved ? 'var(--income)' : 'transparent'}`,
                    transition: 'all 200ms',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    cursor: (profileDirty && firstName.trim()) ? 'pointer' : 'default',
                  }}
                >
                  {profileSaved ? (
                    <><Icon name="check" size={14} stroke={2.5} />{lang === 'es' ? 'Guardado' : 'Saved'}</>
                  ) : savingProfile ? (
                    lang === 'es' ? 'Guardando…' : 'Saving…'
                  ) : (
                    lang === 'es' ? 'Guardar cambios' : 'Save changes'
                  )}
                </button>
              </div>
            </Section>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Appearance */}
            <Section title={t.theme}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([{ id: 'dark', icon: 'moon' }, { id: 'light', icon: 'sun' }] as const).map(opt => {
                  const active = theme === opt.id;
                  return (
                    <button key={opt.id} onClick={() => handleTheme(opt.id)} style={{ padding: '16px 12px', borderRadius: 'var(--r-md)', border: `1.5px solid ${active ? 'var(--blue)' : 'var(--border)'}`, background: active ? 'color-mix(in oklab, var(--blue) 11%, var(--surface))' : 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 140ms' }}>
                      <Icon name={opt.icon} size={20} style={{ color: active ? 'var(--blue)' : 'var(--text-3)' }} />
                      <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--text-3)' }}>{opt.id === 'dark' ? t.dark : t.light}</span>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title={t.language}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([{ id: 'es', cc: 'ES', label: 'Español' }, { id: 'en', cc: 'EN', label: 'English' }] as const).map(opt => {
                  const active = lang === opt.id;
                  return (
                    <button key={opt.id} onClick={() => handleLang(opt.id)} style={{ padding: '12px', borderRadius: 'var(--r-md)', border: `1.5px solid ${active ? 'var(--blue)' : 'var(--border)'}`, background: active ? 'color-mix(in oklab, var(--blue) 11%, var(--surface))' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--text-3)', transition: 'all 140ms' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 20, borderRadius: 5, background: active ? 'color-mix(in oklab, var(--blue) 20%, var(--surface-3))' : 'var(--surface-3)', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: active ? 'var(--blue)' : 'var(--text-3)', letterSpacing: '0.04em' }}>{opt.cc}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title={t.mainCurrency}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([{ id: 'CRC', symbol: '₡', sub: 'Colón CR' }, { id: 'USD', symbol: '$', sub: 'Dólar US' }] as const).map(opt => {
                  const active = currency === opt.id;
                  return (
                    <button key={opt.id} onClick={() => handleCurrency(opt.id)} style={{ padding: '12px 10px', borderRadius: 'var(--r-md)', border: `1.5px solid ${active ? 'var(--blue)' : 'var(--border)'}`, background: active ? 'color-mix(in oklab, var(--blue) 11%, var(--surface))' : 'var(--surface)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 140ms' }}>
                      <span className="mono" style={{ fontSize: 20, color: active ? 'var(--blue)' : 'var(--text-3)', fontWeight: 700, lineHeight: 1 }}>{opt.symbol}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--text-3)' }}>{opt.id}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{opt.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <button onClick={signOut} style={{ width: '100%', padding: '11px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--expense)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 140ms' }}>
            <Icon name="arrow-left" size={15} stroke={2} />
            {t.signOut}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
