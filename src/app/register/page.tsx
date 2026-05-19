'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Icon } from '@/components/ui/Icon';

/* ── Password strength ───────────────────────────────────── */
function getPasswordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
}

const strengthColors = ['var(--border)', 'var(--expense)', 'var(--warn)', 'var(--blue)', 'var(--income)'];
const strengthLabels = ['', 'Muy débil', 'Débil', 'Buena', 'Fuerte'];

/* ── Component ───────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) { setError('Ingresa tu nombre completo.'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    if (!agreed) { setError('Debes aceptar los Términos de servicio para continuar.'); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Ya existe una cuenta con ese correo. Inicia sesión.'
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
          <h1 style={styles.title}>Crea tu cuenta</h1>
          <p style={styles.subtitle}>Empieza gratis hoy</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {/* Full name */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="fullName">Nombre completo</label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Ana García"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              style={styles.input}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>

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
                autoComplete="new-password"
                placeholder="Mín. 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={styles.input}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            {/* Strength indicator */}
            {password.length > 0 && (
              <div style={styles.strengthRow}>
                <div style={styles.strengthDots}>
                  {[1, 2, 3, 4].map(i => (
                    <span
                      key={i}
                      style={{
                        ...styles.strengthDot,
                        background: i <= strength ? strengthColors[strength] : 'var(--surface-3)',
                        transition: 'background 0.2s',
                      }}
                    />
                  ))}
                </div>
                <span style={{ ...styles.strengthLabel, color: strengthColors[strength] }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="confirmPassword">Confirmar contraseña</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon} onClick={() => setShowConfirm(v => !v)}>
                <Icon name={showConfirm ? 'eye-off' : 'eye'} size={16} style={{ color: 'var(--text-3)', cursor: 'pointer' }} />
              </span>
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{
                  ...styles.input,
                  borderColor: confirmPassword && confirmPassword !== password
                    ? 'var(--expense)'
                    : confirmPassword && confirmPassword === password
                      ? 'var(--income)'
                      : 'var(--border)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue)'; }}
                onBlur={e => {
                  e.currentTarget.style.borderColor =
                    confirmPassword && confirmPassword !== password
                      ? 'var(--expense)'
                      : confirmPassword && confirmPassword === password
                        ? 'var(--income)'
                        : 'var(--border)';
                }}
              />
            </div>
            {confirmPassword && confirmPassword === password && (
              <div style={styles.matchRow}>
                <Icon name="check" size={13} stroke={2.5} style={{ color: 'var(--income)' }} />
                <span style={{ fontSize: '12px', color: 'var(--income)' }}>Las contraseñas coinciden</span>
              </div>
            )}
          </div>

          {/* Terms */}
          <label style={styles.checkLabel}>
            <span
              style={{
                ...styles.checkbox,
                background: agreed ? 'var(--blue)' : 'var(--surface-2)',
                borderColor: agreed ? 'var(--blue)' : 'var(--border)',
              }}
              onClick={() => setAgreed(v => !v)}
              role="checkbox"
              aria-checked={agreed}
              tabIndex={0}
              onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAgreed(v => !v); } }}
            >
              {agreed && <Icon name="check" size={11} stroke={3} style={{ color: '#07090F' }} />}
            </span>
            <span style={styles.checkText}>
              Acepto los{' '}
              <Link href="#" style={styles.footerLink}>Términos de servicio</Link>
              {' '}y{' '}
              <Link href="#" style={styles.footerLink}>Política de privacidad</Link>
            </span>
          </label>

          {/* Error */}
          {error && <p style={styles.errorMsg}>{error}</p>}

          {/* Submit */}
          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? (
              <SpinnerIcon />
            ) : (
              <>
                <span>Crear cuenta</span>
                <Icon name="arrow-right" size={16} stroke={2} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p style={styles.footerText}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={styles.footerLink}>Iniciar sesión</Link>
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
  strengthRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '2px',
  },
  strengthDots: {
    display: 'flex',
    gap: '4px',
  },
  strengthDot: {
    width: '32px',
    height: '4px',
    borderRadius: '2px',
  },
  strengthLabel: {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.02em',
    fontFamily: 'var(--font-sans)',
  },
  matchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '2px',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    cursor: 'pointer',
    marginTop: '2px',
  },
  checkbox: {
    flexShrink: 0,
    width: '18px',
    height: '18px',
    borderRadius: 'var(--r-xs)',
    border: '1.5px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    marginTop: '1px',
  },
  checkText: {
    fontSize: '13px',
    color: 'var(--text-2)',
    lineHeight: 1.5,
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
