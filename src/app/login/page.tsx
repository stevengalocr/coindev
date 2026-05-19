'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

/* ─────────────────────────────────────────────
   ICONOS SVG INLINE — sin dependencia externa
───────────────────────────────────────────── */
function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="m3 7 9 6 9-6"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    </svg>
  );
}
function EyeIcon({ off }: { off?: boolean }) {
  if (off) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.75s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.3"/>
      <path d="M12 2v4"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   PANEL IZQUIERDO — showcase de features
───────────────────────────────────────────── */
function BrandPanel() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2800);
    return () => clearInterval(id);
  }, []);

  const features = [
    { icon: '₡', label: 'Multi-moneda', sub: 'CRC · USD · EUR en tiempo real' },
    { icon: '📊', label: 'Presupuestos inteligentes', sub: 'Alertas al 80% de cada categoría' },
    { icon: '🎯', label: 'Metas de ahorro', sub: 'Seguimiento mes a mes con proyecciones' },
    { icon: '🔒', label: 'Datos solo tuyos', sub: 'RLS por usuario en cada tabla' },
  ];

  const stats = [
    { value: '₡2.4M', label: 'Saldo total' },
    { value: '38%', label: 'Tasa de ahorro' },
    { value: '142d', label: 'Fondo emergencia' },
  ];

  return (
    <div style={{
      flex: '0 0 440px', position: 'relative', overflow: 'hidden',
      background: '#07090F',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '40px 44px 44px',
    }} className="login-brand-panel">

      {/* Fondo animado */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-20%',
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,155,255,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-10%',
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(159,123,255,0.16) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', top: '45%', left: '30%',
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,229,209,0.10) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }} />
        {/* Grid sutil */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.03, width: '100%', height: '100%' }}>
          <defs>
            <pattern id="grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.7"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #5BE5D1 0%, #5B9BFF 50%, #9F7BFF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#07090F',
            boxShadow: '0 0 32px rgba(91,155,255,0.4)',
          }}>₡</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#EDF0F7', letterSpacing: '-0.4px' }}>CoinDev</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', marginTop: 1 }}>FINANZAS PERSONALES</div>
          </div>
        </div>
      </div>

      {/* Headline */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{
          fontSize: 34, fontWeight: 700, lineHeight: 1.15,
          letterSpacing: '-0.03em', color: '#EDF0F7', marginBottom: 14,
        }}>
          Tus finanzas,{' '}
          <span style={{
            background: 'linear-gradient(135deg, #5BE5D1 0%, #5B9BFF 45%, #9F7BFF 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>claras como el agua.</span>
        </h2>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 320 }}>
          Control total sobre tu dinero. Cuentas, metas, presupuestos y divisas — todo en un solo lugar.
        </p>
      </div>

      {/* Stats flotantes */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex', gap: 10, marginBottom: 28,
        }}>
          {stats.map(s => (
            <div key={s.label} style={{
              flex: 1, padding: '14px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, backdropFilter: 'blur(10px)',
            }}>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#EDF0F7', letterSpacing: '-0.03em' }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((f, i) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: i === tick % features.length
                ? 'rgba(91,155,255,0.08)'
                : 'rgba(255,255,255,0.025)',
              border: `1px solid ${i === tick % features.length ? 'rgba(91,155,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 12,
              transition: 'background 400ms, border-color 400ms',
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#EDF0F7' }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{f.sub}</div>
              </div>
              <div style={{ marginLeft: 'auto', opacity: i === tick % features.length ? 1 : 0, transition: 'opacity 300ms' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(91,229,209,0.15)', border: '1px solid rgba(91,229,209,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#5BE5D1',
                }}>
                  <CheckIcon />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.02em' }}>
          Hecho para Costa Rica y LATAM · 2026
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────────── */
type Mode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function reset() { setError(''); setSuccess(''); }
  function switchMode(m: Mode) { reset(); setMode(m); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    const sb = createClient();

    try {
      if (mode === 'login') {
        const { error: err } = await sb.auth.signInWithPassword({ email, password });
        if (err) {
          setError(err.message.includes('Invalid login credentials')
            ? 'Correo o contraseña incorrectos.'
            : err.message);
          return;
        }
        router.push('/dashboard');
        return;
      }

      if (mode === 'signup') {
        if (!name.trim()) { setError('Escribe tu nombre completo.'); setLoading(false); return; }
        if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); setLoading(false); return; }
        const { error: err } = await sb.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (err) { setError(err.message); return; }
        setSuccess('¡Cuenta creada! Revisa tu correo para confirmar.');
        return;
      }

      if (mode === 'forgot') {
        const { error: err } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (err) { setError(err.message); return; }
        setSuccess('Te enviamos un enlace de recuperación. Revisa tu bandeja.');
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('fetch') || msg.includes('network')
        ? 'No se pudo conectar. Verifica tu conexión.'
        : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<Mode, { h: string; sub: string; btn: string }> = {
    login:  { h: 'Bienvenido de vuelta', sub: 'Ingresa a tu cuenta', btn: 'Iniciar sesión' },
    signup: { h: 'Crea tu cuenta',       sub: 'Es gratis para empezar', btn: 'Crear cuenta' },
    forgot: { h: 'Recupera tu acceso',   sub: 'Te enviamos un enlace por correo', btn: 'Enviar enlace' },
  };
  const { h, sub, btn } = titles[mode];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#07090F',
      fontFamily: 'var(--font-sans)',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .login-brand-panel { display: flex !important; }
        .login-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 13px 42px 13px 14px;
          font-size: 14px; color: #EDF0F7; outline: none;
          font-family: var(--font-sans);
          transition: border-color 180ms, background 180ms;
          box-sizing: border-box;
        }
        .login-input:focus {
          border-color: rgba(91,155,255,0.6);
          background: rgba(91,155,255,0.04);
        }
        .login-input::placeholder { color: rgba(255,255,255,0.2); }
        .login-btn-primary {
          width: 100%; padding: 14px; border-radius: 13px;
          background: linear-gradient(135deg, #5BE5D1 0%, #5B9BFF 45%, #9F7BFF 100%);
          color: #07090F; font-size: 14px; font-weight: 700;
          font-family: var(--font-sans); letter-spacing: -0.2px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity 150ms, transform 100ms; cursor: pointer;
          border: 0;
        }
        .login-btn-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .login-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .login-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-link-btn {
          background: none; border: 0; padding: 0; cursor: pointer;
          font-family: var(--font-sans); font-size: 13.5px;
          color: rgba(91,155,255,0.9); text-decoration: none;
          transition: color 150ms;
        }
        .login-link-btn:hover { color: #5B9BFF; }
        .login-form-wrap {
          animation: fadeUp 320ms cubic-bezier(0.2,0.8,0.2,1) both;
        }
        @media (max-width: 768px) {
          .login-brand-panel { display: none !important; }
        }
      `}</style>

      {/* Panel Izquierdo */}
      <BrandPanel />

      {/* Panel Derecho — Formulario */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
        background: '#0C0E14',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow suave de fondo */}
        <div style={{
          position: 'absolute', top: '30%', right: '-5%',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,155,255,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

          {/* Logo mobile */}
          <div style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }} className="login-logo-mobile">
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: 'linear-gradient(135deg, #5BE5D1 0%, #5B9BFF 50%, #9F7BFF 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800, color: '#07090F',
            }}>₡</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#EDF0F7' }}>CoinDev</span>
          </div>

          {/* Tabs de modo */}
          {mode !== 'forgot' && (
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 4, marginBottom: 32, gap: 2,
            }}>
              {(['login', 'signup'] as const).map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 9,
                  fontSize: 13.5, fontWeight: mode === m ? 600 : 400,
                  color: mode === m ? '#EDF0F7' : 'rgba(255,255,255,0.35)',
                  background: mode === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'all 160ms',
                }}>
                  {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              ))}
            </div>
          )}

          {/* Formulario */}
          <div key={mode} className="login-form-wrap">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#EDF0F7', letterSpacing: '-0.03em', marginBottom: 6 }}>{h}</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{sub}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>

              {/* Nombre (solo signup) */}
              {mode === 'signup' && (
                <Field label="Nombre completo">
                  <InputIcon><PersonIcon /></InputIcon>
                  <input
                    className="login-input"
                    type="text"
                    autoComplete="name"
                    placeholder="María González"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </Field>
              )}

              {/* Email */}
              <Field label="Correo electrónico">
                <InputIcon><MailIcon /></InputIcon>
                <input
                  className="login-input"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </Field>

              {/* Contraseña (no en forgot) */}
              {mode !== 'forgot' && (
                <Field label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Contraseña</span>
                    {mode === 'login' && (
                      <button type="button" className="login-link-btn" style={{ fontSize: 12.5 }} onClick={() => switchMode('forgot')}>
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                }>
                  <InputIcon onClick={() => setShowPassword(v => !v)} style={{ cursor: 'pointer' }}>
                    <EyeIcon off={showPassword} />
                  </InputIcon>
                  <input
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : '••••••••'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </Field>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  padding: '10px 13px', borderRadius: 10,
                  background: 'rgba(255,107,131,0.08)',
                  border: '1px solid rgba(255,107,131,0.2)',
                  fontSize: 13, color: '#FF6B83', lineHeight: 1.4,
                }}>
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div style={{
                  padding: '10px 13px', borderRadius: 10,
                  background: 'rgba(79,224,169,0.08)',
                  border: '1px solid rgba(79,224,169,0.2)',
                  fontSize: 13, color: '#4FE0A9', lineHeight: 1.4,
                }}>
                  {success}
                </div>
              )}

              <button type="submit" disabled={loading || !!success} className="login-btn-primary" style={{ marginTop: 6 }}>
                {loading ? <SpinnerIcon /> : (
                  <>{btn}<ArrowRightIcon /></>
                )}
              </button>
            </form>

            {/* Volver desde forgot */}
            {mode === 'forgot' && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button className="login-link-btn" onClick={() => switchMode('login')}>
                  ← Volver al inicio de sesión
                </button>
              </div>
            )}

            {/* Términos signup */}
            {mode === 'signup' && (
              <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
                Al crear una cuenta aceptas el uso de tus datos para el funcionamiento de la plataforma.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.45)', display: 'block' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
}

function InputIcon({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <span style={{
      position: 'absolute', right: 13, zIndex: 2,
      color: 'rgba(255,255,255,0.25)',
      display: 'flex', alignItems: 'center', userSelect: 'none',
      ...style,
    }} onClick={onClick}>
      {children}
    </span>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
