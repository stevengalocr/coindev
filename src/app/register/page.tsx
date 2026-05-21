'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Icon } from '@/components/ui/Icon';

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.75s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.3"/>
      <path d="M12 2v4"/>
    </svg>
  );
}

const PERKS = [
  { icon: 'wallet',  text: 'Gestiona todas tus cuentas en un solo lugar' },
  { icon: 'flag',    text: 'Presupuestos y alertas inteligentes' },
  { icon: 'target',  text: 'Metas de ahorro con seguimiento automático' },
  { icon: 'swap',    text: 'Tipos de cambio CRC · USD en tiempo real' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Escribe tu nombre.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setError('');
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error: signUpErr } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (signUpErr) {
        setError(
          signUpErr.message.includes('already registered') || signUpErr.message.includes('already exists')
            ? 'Este correo ya está registrado. Intenta iniciar sesión.'
            : signUpErr.message
        );
        return;
      }

      // If session came back immediately → go to dashboard
      if (data.session) {
        if (data.user) {
          await sb.from('profiles').update({ full_name: name.trim() }).eq('id', data.user.id);
        }
        router.push('/dashboard');
        return;
      }

      // Email was auto-confirmed server-side — sign in now to get a session
      const { error: signInErr } = await sb.auth.signInWithPassword({ email, password });
      if (signInErr) {
        // Shouldn't happen, but fallback
        setError('Cuenta creada. Inicia sesión para continuar.');
        router.push('/login');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#07090F', fontFamily: 'var(--font-sans)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .reg-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 13px 14px;
          font-size: 14px; color: #EDF0F7; outline: none;
          font-family: var(--font-sans);
          transition: border-color 180ms, background 180ms;
          box-sizing: border-box;
        }
        .reg-input:focus { border-color: rgba(91,155,255,0.6); background: rgba(91,155,255,0.04); }
        .reg-input::placeholder { color: rgba(255,255,255,0.2); }
        .reg-panel { display: flex !important; }
        @media (max-width: 768px) { .reg-panel { display: none !important; } }
      `}</style>

      {/* Left brand panel */}
      <div className="reg-panel" style={{
        flex: '0 0 420px', background: '#07090F',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 44px 44px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-20%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,155,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '5%', right: '-10%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,229,209,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>
        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #5BE5D1 0%, #5B9BFF 50%, #9F7BFF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(91,155,255,0.35)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#07090F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#EDF0F7', letterSpacing: '-0.4px' }}>CoinDev</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em', marginTop: 1 }}>FINANZAS PERSONALES</div>
          </div>
        </div>
        {/* Trial banner */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(91,229,209,0.08)', border: '1px solid rgba(91,229,209,0.2)', marginBottom: 24 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5BE5D1', boxShadow: '0 0 8px #5BE5D1' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#5BE5D1' }}>Prueba gratuita por 7 días</span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#EDF0F7', marginBottom: 12 }}>
            Empieza a tomar{' '}
            <span style={{ background: 'linear-gradient(135deg, #5BE5D1 0%, #5B9BFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              el control
            </span>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 28 }}>
            Sin tarjeta de crédito. Sin compromisos. Solo tus finanzas, ordenadas.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PERKS.map(p => (
              <div key={p.icon} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(91,155,255,0.08)', border: '1px solid rgba(91,155,255,0.12)', display: 'grid', placeItems: 'center', color: 'rgba(91,155,255,0.7)', flexShrink: 0 }}>
                  <Icon name={p.icon} size={14} stroke={1.7} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, fontSize: 11.5, color: 'rgba(255,255,255,0.18)' }}>
          Hecho para Costa Rica y LATAM · 2026
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#0C0E14', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', right: '-5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,229,209,0.05) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ width: '100%', maxWidth: 400, position: 'relative', animation: 'fadeUp 320ms cubic-bezier(0.2,0.8,0.2,1) both' }}>
          {/* Trial chip — mobile only */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }} className="reg-panel-hide">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(91,229,209,0.08)', border: '1px solid rgba(91,229,209,0.2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BE5D1' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#5BE5D1' }}>7 días gratis · Sin tarjeta</span>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#EDF0F7', letterSpacing: '-0.03em', marginBottom: 6 }}>Crear cuenta</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Comienza tu prueba gratuita de 7 días</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
            <Field label="Nombre completo">
              <input
                className="reg-input"
                type="text"
                autoComplete="name"
                placeholder="Tu nombre"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </Field>

            <Field label="Correo electrónico">
              <input
                className="reg-input"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Contraseña">
              <div style={{ position: 'relative' }}>
                <input
                  className="reg-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: 42 }}
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="2" y1="2" x2="22" y2="22"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </Field>

            {error && (
              <div style={{ padding: '10px 13px', borderRadius: 10, background: 'rgba(255,107,131,0.08)', border: '1px solid rgba(255,107,131,0.2)', fontSize: 13, color: '#FF6B83', lineHeight: 1.4 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 13, marginTop: 6,
              background: 'linear-gradient(135deg, #5BE5D1 0%, #5B9BFF 45%, #9F7BFF 100%)',
              color: '#07090F', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              border: 0, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'opacity 150ms',
            }}>
              {loading ? <SpinnerIcon /> : 'Comenzar prueba de 7 días'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13.5, color: 'rgba(255,255,255,0.3)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color: 'rgba(91,155,255,0.8)', fontWeight: 500, textDecoration: 'none' }}>
              Inicia sesión
            </Link>
          </div>

          <p style={{ marginTop: 20, fontSize: 11.5, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.6 }}>
            Al registrarte aceptas los términos de uso. Tu prueba de 7 días comienza al crear la cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>{label}</label>
      {children}
    </div>
  );
}
