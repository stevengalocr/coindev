'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Icon } from '@/components/ui/Icon';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : authError.message);
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (authError) setError(authError.message);
  }

  return (
    <div style={styles.root}>
      {/* Background glow */}
      <div style={styles.glow} aria-hidden="true" />

      {/* Brand */}
      <div style={styles.brand}>
        <Icon name="logo" size={32} />
        <span style={styles.brandName}>CoinDev</span>
      </div>

      {/* Card */}
      <div className="cd-card" style={styles.card}>
        <div style={styles.cardHeader}>
          <h1 style={styles.title}>Bienvenido de vuelta</h1>
          <p style={styles.subtitle}>Ingresa a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">Correo electrónico</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <Icon name="globe" size={16} style={{ color: 'var(--text-3)' }} />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={styles.input}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Contraseña</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon} onClick={() => setShowPassword(v => !v)}>
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={16} style={{ color: 'var(--text-3)', cursor: 'pointer' }} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={styles.input}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
          </div>

          {/* Error */}
          {error && <p style={styles.errorMsg}>{error}</p>}

          {/* Submit */}
          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? (
              <SpinnerIcon />
            ) : (
              <>
                <span>Iniciar sesión</span>
                <Icon name="arrow-right" size={16} stroke={2} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={styles.dividerRow}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>o continuar con</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Google */}
        <button type="button" onClick={handleGoogle} style={styles.btnGoogle}>
          <GoogleIcon />
          <span>Continuar con Google</span>
        </button>

        {/* Footer */}
        <p style={styles.footerText}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={styles.footerLink}>Registrarse</Link>
        </p>
      </div>

      {/* Tagline */}
      <p style={styles.tagline}>Tus finanzas, claras como el agua</p>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function SpinnerIcon() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'cd-spin 0.75s linear infinite' }}
    >
      <style>{`@keyframes cd-spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.4"/>
      <path d="M12 2v4"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Styles ──────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px 48px',
    background: 'var(--bg)',
    position: 'relative',
    overflow: 'hidden',
    gap: '20px',
    fontFamily: 'var(--font-sans)',
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -58%)',
    width: '700px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(91,155,255,0.10) 0%, rgba(159,123,255,0.06) 40%, transparent 70%)',
    pointerEvents: 'none',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 1,
  },
  brandName: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.4px',
    color: 'var(--text)',
    fontFamily: 'var(--font-sans)',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '32px 28px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    zIndex: 1,
  },
  cardHeader: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    color: 'var(--text)',
    lineHeight: 1.25,
    marginBottom: '4px',
    fontFamily: 'var(--font-sans)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-2)',
    fontFamily: 'var(--font-sans)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-2)',
    letterSpacing: '0.01em',
    fontFamily: 'var(--font-sans)',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    zIndex: 2,
    userSelect: 'none',
  },
  input: {
    width: '100%',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-sm)',
    padding: '12px 40px 12px 14px',
    fontSize: '14px',
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'var(--font-sans)',
  },
  errorMsg: {
    fontSize: '13px',
    color: 'var(--expense)',
    padding: '8px 12px',
    background: 'var(--expense-soft)',
    borderRadius: 'var(--r-xs)',
    border: '1px solid rgba(255,107,131,0.2)',
    fontFamily: 'var(--font-sans)',
  },
  btnPrimary: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'var(--gradient-hero)',
    border: 'none',
    borderRadius: 'var(--r-md)',
    padding: '14px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#07090F',
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.1s',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '-0.1px',
    marginTop: '2px',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--border)',
    display: 'block',
  },
  dividerText: {
    fontSize: '12px',
    color: 'var(--text-3)',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-sans)',
  },
  btnGoogle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    padding: '12px 14px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    fontFamily: 'var(--font-sans)',
    marginBottom: '20px',
  },
  footerText: {
    fontSize: '13px',
    color: 'var(--text-2)',
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
  },
  footerLink: {
    color: 'var(--blue)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  tagline: {
    fontSize: '13px',
    color: 'var(--text-3)',
    letterSpacing: '0.02em',
    zIndex: 1,
    fontFamily: 'var(--font-sans)',
  },
};
