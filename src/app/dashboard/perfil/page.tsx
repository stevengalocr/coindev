'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { Icon } from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase';
import { FeedbackModal } from '@/components/screens/FeedbackModal';

const ADMIN_EMAIL = 'stevengalocr@gmail.com';

const EMOJIS = ['😊','🧑‍💼','🦊','🐼','🦁','🌟','🎯','💎','🚀','🌊','🔥','⚡','🌙','🌺','🎨','🤖'];

function isUrl(s: string | null | undefined) {
  return !!s && (s.startsWith('http://') || s.startsWith('https://'));
}

function Toggle({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!active)}
      role="switch"
      aria-checked={active}
      style={{
        width: 44, height: 24, borderRadius: 999,
        background: active ? 'var(--cyan)' : 'var(--surface-3)',
        border: '1.5px solid',
        borderColor: active ? 'var(--cyan)' : 'var(--border)',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        transition: 'background 200ms, border-color 200ms',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: active ? 22 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        transition: 'left 200ms',
      }} />
    </button>
  );
}

export default function PerfilPage() {
  const { lang, theme, t, setLang, setTheme } = useApp();
  const { user, profile, saveProfile } = useData();
  const router = useRouter();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Name editing — profile loads async, sync when ready
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    if (!profile?.full_name) return;
    const parts = profile.full_name.trim().split(' ');
    setFirstName(parts[0] ?? '');
    setLastName(parts.slice(1).join(' ') ?? '');
  }, [profile?.full_name]);

  // Avatar
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAllEmoji, setShowAllEmoji] = useState(false);

  const displayName = profile?.full_name ?? 'Usuario';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const nameDirty =
    [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') !== (profile?.full_name ?? '');

  const planLabel = profile?.plan_status === 'active'
    ? (lang === 'es' ? 'Plan Pro' : 'Pro Plan')
    : profile?.plan_status === 'trial'
    ? (lang === 'es' ? 'Período de prueba' : '7-day Trial')
    : (lang === 'es' ? 'Gratuito' : 'Free');

  async function handleTheme(val: 'dark' | 'light') {
    setTheme(val);
    await saveProfile({ theme: val });
  }

  async function handleLang(val: 'es' | 'en') {
    setLang(val);
    await saveProfile({ language: val });
  }

  async function handleSaveName() {
    const full_name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!full_name) return;
    setSavingName(true);
    try {
      await saveProfile({ full_name });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } finally {
      setSavingName(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const supabase = createClient();
      // Remove any existing avatar files to avoid orphaned files on extension change
      const { data: existing } = await supabase.storage.from('avatars').list(user.id);
      if (existing?.length) {
        await supabase.storage.from('avatars').remove(existing.map(f => `${user.id}/${f.name}`));
      }
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await saveProfile({ avatar_url: `${data.publicUrl}?t=${Date.now()}` });
      setAvatarOpen(false);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleEmojiPick(em: string) {
    await saveProfile({ avatar_url: em });
    setAvatarOpen(false);
  }

  async function handleRemoveAvatar() {
    await saveProfile({ avatar_url: null });
    setAvatarOpen(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await createClient().auth.signOut();
    router.replace('/login');
  }

  const emojiRow = showAllEmoji ? EMOJIS : EMOJIS.slice(0, 8);

  return (
    <div className="page-enter" style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>
      <style>{`
        .pf-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
        .pf-row + .pf-row { border-top: 1px solid var(--border); }
        .pf-label { font-size: 13.5px; font-weight: 500; color: var(--text); }
        .pf-sub { font-size: 12px; color: var(--text-3); margin-top: 2px; }
        .sp-input { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r-md); padding: 9px 12px; color: var(--text); font-size: 13.5px; width: 100%; outline: none; transition: border-color 150ms; box-sizing: border-box; font-family: inherit; }
        .sp-input:focus { border-color: var(--cyan); }
        .sp-input::placeholder { color: var(--text-3); }
        .mobile-only { display: none !important; }
        @media (max-width: 768px) { .mobile-only { display: block !important; } }
      `}</style>

      {/* Hidden inputs */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }} onChange={handlePhotoUpload} />

      {/* ── Avatar card ── */}
      <div className="cd-card" style={{ padding: '20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <button
            onClick={() => setAvatarOpen(v => !v)}
            style={{
              position: 'relative', width: 60, height: 60, borderRadius: '50%',
              background: 'var(--gradient-hero)', border: 'none', cursor: 'pointer',
              padding: 0, flexShrink: 0, overflow: 'hidden',
            }}
          >
            {isUrl(profile?.avatar_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile!.avatar_url!} alt={displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : profile?.avatar_url ? (
              <span style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', fontSize: 28 }}>
                {profile.avatar_url}
              </span>
            ) : (
              <span style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', fontSize: 20, fontWeight: 800, color: 'var(--btn-hero-text)', letterSpacing: '-0.02em' }}>
                {initials}
              </span>
            )}
            {/* camera hint on hover */}
            <span className="av-hint" style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 160ms', color: '#fff',
            }}>
              <Icon name="camera" size={18} />
            </span>
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 999, background: 'color-mix(in oklab, var(--cyan) 12%, var(--surface-3))', border: '1px solid color-mix(in oklab, var(--cyan) 22%, var(--border))' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.02em' }}>{planLabel}</span>
            </div>
          </div>
        </div>

        {/* Avatar picker — only shown when open */}
        {avatarOpen && (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              {lang === 'es' ? 'Cambiar avatar' : 'Change avatar'}
            </div>
            {/* Upload photo */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--r-md)',
                background: 'color-mix(in oklab, var(--cyan) 10%, var(--surface))',
                border: '1.5px solid color-mix(in oklab, var(--cyan) 25%, var(--border))',
                color: 'var(--cyan)', fontSize: 13, fontWeight: 600,
                marginBottom: 10, cursor: 'pointer',
              }}
            >
              <Icon name="camera" size={16} />
              {uploading
                ? (lang === 'es' ? 'Subiendo…' : 'Uploading…')
                : (lang === 'es' ? 'Subir foto' : 'Upload photo')}
            </button>

            {/* Emoji row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {emojiRow.map(em => (
                <button
                  key={em}
                  onClick={() => handleEmojiPick(em)}
                  style={{
                    width: 36, height: 36, borderRadius: 10, fontSize: 20,
                    border: `1.5px solid ${profile?.avatar_url === em ? 'var(--cyan)' : 'var(--border)'}`,
                    background: profile?.avatar_url === em
                      ? 'color-mix(in oklab, var(--cyan) 14%, var(--surface))'
                      : 'var(--surface)',
                    display: 'grid', placeItems: 'center', cursor: 'pointer',
                    transition: 'all 120ms',
                  }}
                >
                  {em}
                </button>
              ))}
              {!showAllEmoji && (
                <button
                  onClick={() => setShowAllEmoji(true)}
                  style={{
                    width: 36, height: 36, borderRadius: 10, fontSize: 11, fontWeight: 700,
                    border: '1.5px solid var(--border)', background: 'var(--surface)',
                    color: 'var(--text-3)', cursor: 'pointer',
                  }}
                >
                  +{EMOJIS.length - 8}
                </button>
              )}
              {profile?.avatar_url && (
                <button
                  onClick={handleRemoveAvatar}
                  title={lang === 'es' ? 'Quitar avatar' : 'Remove avatar'}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    border: '1.5px solid var(--border)', background: 'var(--surface)',
                    color: 'var(--expense)', fontSize: 14, cursor: 'pointer',
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  <Icon name="x" size={14} stroke={2.2} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Accesos rápidos FINANZAS (primero) ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingLeft: 2 }}>
          {lang === 'es' ? 'Finanzas' : 'Finance'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          {([
            { href: '/dashboard/cuentas',      icon: 'bank',   label_es: 'Cuentas',      label_en: 'Accounts',  color: 'var(--blue)'   },
            { href: '/dashboard/presupuestos', icon: 'flag',   label_es: 'Presupuestos', label_en: 'Budgets',   color: 'var(--cyan)'   },
            { href: '/dashboard/gastos-fijos', icon: 'shield', label_es: 'Gastos fijos', label_en: 'Fixed exp.',color: 'var(--income)' },
            { href: '/dashboard/metas',        icon: 'spark',  label_es: 'Metas',        label_en: 'Goals',     color: 'var(--violet)' },
          ] as const).map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 15px', borderRadius: 'var(--r-md)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              textDecoration: 'none', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: `color-mix(in oklab, ${item.color} 14%, var(--surface-3))`,
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name={item.icon} size={17} stroke={1.8} style={{ color: item.color }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
                {lang === 'es' ? item.label_es : item.label_en}
              </span>
            </Link>
          ))}
        </div>
        <Link href="/dashboard/reportes" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 15px', borderRadius: 'var(--r-md)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          textDecoration: 'none', boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'color-mix(in oklab, var(--warn) 14%, var(--surface-3))',
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name="chart" size={17} stroke={1.8} style={{ color: 'var(--warn)' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {lang === 'es' ? 'Reportes' : 'Reports'}
          </span>
          <Icon name="chevron-right" size={15} style={{ color: 'var(--text-4)', marginLeft: 'auto' }} />
        </Link>
      </div>

      {/* ── Mi cuenta ── */}
      <div className="cd-card" style={{ padding: '16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          {lang === 'es' ? 'Mi cuenta' : 'My account'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>{lang === 'es' ? 'Nombre' : 'First name'}</div>
            <input className="sp-input" value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder={lang === 'es' ? 'Tu nombre' : 'Your name'} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>{lang === 'es' ? 'Apellido' : 'Last name'}</div>
            <input className="sp-input" value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder={lang === 'es' ? 'Tu apellido' : 'Your last name'} />
          </div>
        </div>
        {nameDirty && (
          <button
            onClick={handleSaveName}
            disabled={savingName || !firstName.trim()}
            style={{
              width: '100%', padding: '10px', borderRadius: 'var(--r-md)',
              background: nameSaved ? 'var(--income-soft)' : 'var(--gradient-hero)',
              color: nameSaved ? 'var(--income)' : 'var(--btn-hero-text)',
              border: `1px solid ${nameSaved ? 'var(--income)' : 'transparent'}`,
              fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer', transition: 'all 200ms',
            }}
          >
            {nameSaved
              ? <><Icon name="check" size={14} stroke={2.5} />{lang === 'es' ? 'Guardado' : 'Saved'}</>
              : savingName
              ? (lang === 'es' ? 'Guardando…' : 'Saving…')
              : (lang === 'es' ? 'Guardar nombre' : 'Save name')}
          </button>
        )}
      </div>

      {/* ── Apariencia ── */}
      <div className="cd-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {lang === 'es' ? 'Apariencia' : 'Appearance'}
        </div>

        {/* Theme toggle */}
        <div className="pf-row">
          <div>
            <div className="pf-label">
              <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={14} stroke={1.8} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--text-3)' }} />
              {theme === 'dark' ? t.dark : t.light}
            </div>
            <div className="pf-sub">{lang === 'es' ? 'Cambiar apariencia de la app' : 'Change app appearance'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.dark}</span>
            <Toggle active={theme === 'light'} onChange={v => handleTheme(v ? 'light' : 'dark')} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.light}</span>
          </div>
        </div>

        {/* Language dropdown */}
        <div className="pf-row">
          <div>
            <div className="pf-label">
              <Icon name="globe" size={14} stroke={1.8} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--text-3)' }} />
              {t.language}
            </div>
            <div className="pf-sub">{lang === 'es' ? 'Idioma de la interfaz' : 'Interface language'}</div>
          </div>
          <select
            value={lang}
            onChange={e => handleLang(e.target.value as 'es' | 'en')}
            style={{
              padding: '7px 10px', borderRadius: 'var(--r-sm)',
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              color: 'var(--text)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', outline: 'none', minWidth: 110,
            }}
          >
            <option value="es">🇨🇷 Español</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>
      </div>

      {/* ── Soporte ── */}
      <div className="cd-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
        {isAdmin ? (
          <Link href="/dashboard/admin" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', textDecoration: 'none',
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'color-mix(in oklab, var(--violet) 14%, var(--surface-3))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="lock" size={17} stroke={1.7} style={{ color: 'var(--violet)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="pf-label">{lang === 'es' ? 'Administración' : 'Admin panel'}</div>
              <div className="pf-sub">{lang === 'es' ? 'Panel de control' : 'Manage users & feedback'}</div>
            </div>
            <Icon name="chevron-right" size={16} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
          </Link>
        ) : (
          <button onClick={() => setFeedbackOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', width: '100%', textAlign: 'left',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'color-mix(in oklab, var(--violet) 14%, var(--surface-3))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="edit" size={17} stroke={1.7} style={{ color: 'var(--violet)' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div className="pf-label">{lang === 'es' ? 'Reportar / Sugerir' : 'Report / Suggest'}</div>
              <div className="pf-sub">{lang === 'es' ? 'Bugs, mejoras o consultas' : 'Bugs, improvements or questions'}</div>
            </div>
            <Icon name="chevron-right" size={16} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
          </button>
        )}
      </div>

      {/* ── Logout ── */}
      <button onClick={handleLogout} disabled={loggingOut} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderRadius: 'var(--r-md)',
        background: 'var(--expense-soft)', border: '1px solid rgba(255,107,131,0.2)',
        color: 'var(--expense)', fontSize: 13.5, fontWeight: 600,
        opacity: loggingOut ? 0.6 : 1, transition: 'opacity 150ms', cursor: 'pointer',
      }}>
        <Icon name="logout" size={18} stroke={1.7} />
        {loggingOut
          ? (lang === 'es' ? 'Cerrando sesión…' : 'Signing out…')
          : (lang === 'es' ? 'Cerrar sesión' : 'Sign out')}
      </button>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      <style>{`button:hover .av-hint { opacity: 1 !important; }`}</style>
    </div>
  );
}
