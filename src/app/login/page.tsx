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

  return (
    <div style={styles.root}>
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

          {error && <p style={styles.errorMsg}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? <SpinnerIcon /> : (
              <>
                <span>Iniciar sesión</span>
                <Icon name="arrow-right" size={16} stroke={2} />
              </>
            )}
          </button>
        </form>

        <p style={styles.footerText}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={styles.footerLink}>Registrarse</Link>
        </p>
      </div>

      <p style={styles.tagline}>Tus finanzas, claras como el agua</p>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'cd-spin 0.75s linear infinite' }}
    >
      <style>{`@keyframes cd-spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.4"/>
      <path d="M12 2v4"/>
    </svg>
  );
}

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
  footerText: {
    fontSize: '13px',
    color: 'var(--text-2)',
    textAlign: 'center',
    fontFamily: 'var(--font-sans)',
    marginTop: '20px',
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
