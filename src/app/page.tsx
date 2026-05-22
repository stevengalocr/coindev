'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

const CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ?? '#pricing';

/* ── Inline SVG icons ──────────────────────────────────────────────── */
const PATHS: Record<string, string[]> = {
  menu: ['M4 6h16M4 12h16M4 18h16'],
  x: ['M18 6 6 18M6 6l12 12'],
  arrow: ['M5 12h14M12 5l7 7-7 7'],
  check: ['M20 6 9 17l-5-5'],
  zap: ['M13 2 3 14h9l-1 8 10-12h-9l1-8z'],
  globe: ['M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
  wallet: ['M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z', 'M16 3H8L6 7h12l-2-4z'],
  chart: ['M3 3v18h18', 'M18 9l-5 5-4-4-4 4'],
  target: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z'],
  repeat: ['M17 1l4 4-4 4', 'M3 11V9a4 4 0 0 1 4-4h14', 'M7 23l-4-4 4-4', 'M21 13v2a4 4 0 0 1-4 4H3'],
  lock: ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  coins: ['M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z', 'M12 22c5.523 0 10-2.239 10-5s-4.477-5-10-5S2 14.239 2 17s4.477 5 10 5z'],
  trending: ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'],
  swap: ['M7 16V4m0 0L3 8m4-4 4 4', 'M17 8v12m0 0 4-4m-4 4-4-4'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  help: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h.01'],
};

function Icon({ name, size = 20, stroke = 1.7, color }: { name: string; size?: number; stroke?: number; color?: string }) {
  const paths = PATHS[name] ?? PATHS.help;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

/* ── Navbar ─────────────────────────────────────────────────────────── */
function Navbar() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { href: '#features', label: 'Características' },
    { href: '#manual', label: 'Manual' },
    { href: '#pricing', label: 'Precio' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(7,9,15,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(35,42,61,0.8)' : '1px solid transparent',
      transition: 'all 220ms',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 32 }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="CoinDev" width={30} height={30} style={{ borderRadius: 8 }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: '#EDF0F7', letterSpacing: '-0.03em' }}>CoinDev</span>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }} className="ld-dlinks">
          {links.map(l => (
            <a key={l.href} href={l.href} style={{ fontSize: 14, fontWeight: 500, color: '#9098AE', textDecoration: 'none', transition: 'color 140ms' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EDF0F7')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9098AE')}>
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }} className="ld-dlinks">
          {loggedIn ? (
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 999, background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color: '#0C0E14', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' }}>
              Ir al app <Icon name="arrow" size={14} />
            </Link>
          ) : (
            <>
              <Link href="/login" style={{ fontSize: 13.5, fontWeight: 500, color: '#9098AE', textDecoration: 'none', padding: '8px 14px' }}>
                Iniciar sesión
              </Link>
              <a href={CHECKOUT_URL} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 999, background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color: '#0C0E14', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' }}>
                Empezar gratis
              </a>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(v => !v)} style={{ marginLeft: 'auto', display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#9098AE', padding: 4 }} className="ld-mbtn">
          <Icon name={mobileOpen ? 'x' : 'menu'} size={22} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: '#0C111B', borderTop: '1px solid #232A3D', padding: '16px 24px 28px' }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '12px 0', fontSize: 15, fontWeight: 500, color: '#9098AE', textDecoration: 'none', borderBottom: '1px solid #232A3D' }}>
              {l.label}
            </a>
          ))}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/login" style={{ textAlign: 'center', padding: '12px', borderRadius: 14, border: '1px solid #232A3D', color: '#9098AE', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
            <a href={CHECKOUT_URL} style={{ textAlign: 'center', padding: '12px', borderRadius: 14, background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color: '#0C0E14', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              7 días gratis — Empezar
            </a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .ld-dlinks { display: none !important; }
          .ld-mbtn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ paddingTop: 136, paddingBottom: 80, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, background: 'radial-gradient(ellipse, rgba(91,155,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 999, background: 'rgba(91,229,209,0.08)', border: '1px solid rgba(91,229,209,0.2)', marginBottom: 28 }}>
          <Icon name="zap" size={13} color="#5BE5D1" />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#5BE5D1' }}>7 días gratis · Sin tarjeta requerida</span>
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, color: '#EDF0F7', marginBottom: 22 }}>
          Tus finanzas personales,{' '}
          <span style={{ background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            claras como el agua
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2.2vw, 19px)', color: '#9098AE', lineHeight: 1.65, maxWidth: 620, margin: '0 auto 36px', fontWeight: 400 }}>
          Control total de tus cuentas, movimientos, presupuestos y metas de ahorro. Diseñado para LATAM con soporte para CRC, USD y 16 monedas más.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 60 }}>
          <a href={CHECKOUT_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color: '#0C0E14', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(91,155,255,0.25)' }}>
            Comenzar gratis — 7 días <Icon name="arrow" size={16} color="#0C0E14" />
          </a>
          <a href="#manual" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, background: '#10141F', color: '#9098AE', border: '1px solid #232A3D', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            <Icon name="book" size={16} /> Ver manual
          </a>
        </div>

        {/* Dashboard preview */}
        <DashboardMockup />
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: 780 }}>
      <div style={{ background: '#0C111B', border: '1px solid #232A3D', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 120px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)' }}>
        {/* Window chrome */}
        <div style={{ background: '#10141F', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #232A3D' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#161B2A', padding: '3px 20px', borderRadius: 6, fontSize: 12, color: '#626B85' }}>coindev.app/dashboard</div>
          </div>
        </div>
        {/* Cards */}
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12 }}>
          <div style={{ background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', borderRadius: 16, padding: '22px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0C0E14' }}>Balance total</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: '#0C0E14', marginBottom: 4 }}>₡2,847,500</div>
            <div style={{ fontSize: 12, opacity: 0.6, color: '#0C0E14', marginBottom: 16 }}>+₡127,000 este mes</div>
            <div style={{ height: 40, background: 'rgba(0,0,0,0.15)', borderRadius: 8, display: 'flex', alignItems: 'flex-end', padding: '4px', gap: 3 }}>
              {[30,50,45,68,55,82,65,90,72,88,70,95].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
              ))}
            </div>
          </div>
          <div style={{ background: '#10141F', border: '1px solid #232A3D', borderRadius: 16, padding: '18px' }}>
            <div style={{ fontSize: 10, color: '#626B85', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Ingresos</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#4FE0A9', letterSpacing: '-0.02em', marginBottom: 6 }}>₡1,900,000</div>
            <div style={{ fontSize: 11, color: '#626B85' }}>↑ 8% vs mes anterior</div>
          </div>
          <div style={{ background: '#10141F', border: '1px solid #232A3D', borderRadius: 16, padding: '18px' }}>
            <div style={{ fontSize: 10, color: '#626B85', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Gastos</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#FF6B83', letterSpacing: '-0.02em', marginBottom: 6 }}>₡1,247,000</div>
            <div style={{ fontSize: 11, color: '#626B85' }}>↓ 3% vs mes anterior</div>
          </div>
          <div style={{ background: '#10141F', border: '1px solid #232A3D', borderRadius: 14, padding: '14px 16px', gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { name: 'BAC Colones', bal: '₡1,240,000', col: '#5B9BFF' },
              { name: 'BAC Dólares', bal: '$1,200', col: '#4FE0A9' },
              { name: 'Efectivo', bal: '₡85,000', col: '#F2C94C' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${a.col}22`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.col }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#EDF0F7' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: '#626B85', fontFamily: 'monospace' }}>{a.bal}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: -14, right: -10, background: '#10141F', border: '1px solid #232A3D', borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FE0A9', boxShadow: '0 0 6px #4FE0A9' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#EDF0F7' }}>En tiempo real</span>
      </div>
    </div>
  );
}

/* ── Stats ──────────────────────────────────────────────────────────── */
function Stats() {
  const items = [
    { value: '18+', label: 'Monedas LATAM soportadas' },
    { value: '6', label: 'Módulos completamente funcionales' },
    { value: '100%', label: 'Datos privados y cifrados' },
    { value: '$4.99', label: 'Al mes, todo incluido' },
  ];
  return (
    <section style={{ padding: '48px 24px', borderTop: '1px solid #232A3D', borderBottom: '1px solid #232A3D' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, textAlign: 'center' }}>
        {items.map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#626B85', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: 'wallet',   color: '#5B9BFF', title: 'Cuentas multi-moneda',      desc: 'Agrega cuentas bancarias, de ahorros, efectivo y tarjetas. Cada cuenta maneja su propia moneda: CRC, USD, MXN y más.' },
  { icon: 'swap',     color: '#4FE0A9', title: 'Movimientos categorizados', desc: 'Registra ingresos y gastos con categorías inteligentes. Filtra por fecha, tipo y cuenta. Historial completo siempre disponible.' },
  { icon: 'chart',    color: '#9F7BFF', title: 'Presupuestos mensuales',    desc: 'Define límites por categoría y visualiza tu progreso con barras de avance y alertas cuando te acercas al límite.' },
  { icon: 'target',   color: '#FF8BB5', title: 'Metas de ahorro',           desc: 'Crea objetivos con fechas límite. Abona desde cualquier cuenta — si las monedas difieren, CoinDev convierte automáticamente.' },
  { icon: 'repeat',   color: '#F2C94C', title: 'Gastos fijos',              desc: 'Alquiler, Netflix, servicios... todos tus pagos recurrentes en un solo lugar. Nunca más olvides un pago importante.' },
  { icon: 'trending', color: '#5BE5D1', title: 'Reportes y análisis',       desc: 'Gráfica de evolución anual, desglose por categoría y comparativa mensual. Entiende tus finanzas con datos reales.' },
];

function Features() {
  return (
    <section id="features" style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SectionBadge text="Módulos" />
        <h2 style={sectionTitle}>Todo lo que necesitas para controlar tu dinero</h2>
        <p style={sectionSub}>Seis módulos diseñados para trabajar juntos. Sin complicaciones, sin curva de aprendizaje.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: '#10141F', border: '1px solid #232A3D', borderRadius: 20, padding: '28px', transition: 'border-color 200ms, transform 200ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = f.color + '55'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#232A3D'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.color + '18', display: 'grid', placeItems: 'center', marginBottom: 18 }}>
                <Icon name={f.icon} size={20} color={f.color} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#EDF0F7', marginBottom: 8, letterSpacing: '-0.02em' }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: '#626B85', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Manual ─────────────────────────────────────────────────────────── */
const MODULES = [
  {
    id: 'cuentas', icon: 'wallet', color: '#5B9BFF', title: 'Cuentas',
    intro: 'Las cuentas son la base de CoinDev. Representan tus activos financieros reales y definen la moneda de tus movimientos.',
    steps: [
      { t: 'Crear una cuenta', d: 'Ve a "Cuentas" y toca "+". Elige el tipo (banco, ahorros, efectivo o tarjeta de crédito), asígnale nombre, color, moneda nativa y saldo inicial. Toma menos de 1 minuto.' },
      { t: 'Tipos de cuenta', d: 'Cuenta bancaria: cuentas corrientes. Ahorros: cuentas de ahorro. Efectivo: dinero físico. Tarjeta de crédito: define el límite y los últimos 4 dígitos para identificarla.' },
      { t: 'Moneda por cuenta', d: 'Cada cuenta tiene su propia moneda. Los movimientos heredan esa moneda. El dashboard convierte todo a CRC usando el tipo de cambio en tiempo real para el total.' },
      { t: 'Editar y gestionar', d: 'Usa el menú (⋯) de cada cuenta para editar nombre, color o límite de crédito. La moneda no puede cambiarse después de crear la cuenta.' },
    ],
    tips: ['Crea una cuenta por cada cuenta bancaria real', 'El saldo inicial debe reflejar el saldo actual hoy', 'Usa colores distintos para diferenciar visualmente tus cuentas'],
  },
  {
    id: 'movimientos', icon: 'swap', color: '#4FE0A9', title: 'Movimientos',
    intro: 'El historial completo de tu vida financiera. Cada ingreso y gasto categorizado y disponible siempre.',
    steps: [
      { t: 'Registrar un movimiento', d: 'Toca el botón "+" o usa el triple-tap en "Inicio" como atajo rápido. Elige tipo (ingreso/gasto), cuenta, monto, categoría y fecha. Opcionalmente agrega descripción.' },
      { t: 'Categorías disponibles', d: 'Ingresos: Salario, Freelance, Inversiones, Bonos, Otros. Gastos: Alquiler, Supermercado, Comida, Transporte, Salud, Educación, Entretenimiento, Suscripciones, Ropa, Tecnología, Servicios, Tarjeta, Mascotas, Viajes, Otros.' },
      { t: 'Gastos fijos', d: 'Activa "Gasto fijo" al registrar para marcarlo como recurrente. CoinDev lo vincula automáticamente al módulo de Gastos Fijos y te avisa en los próximos ciclos.' },
      { t: 'Filtros y búsqueda', d: 'En Movimientos filtra por tipo, mes y cuenta. La barra de búsqueda encuentra movimientos por descripción o categoría en tiempo real.' },
    ],
    tips: ['Registra en el momento para no olvidar', 'Usa la descripción para detalles como # de factura', 'Los montos se muestran en la moneda nativa de la cuenta'],
  },
  {
    id: 'presupuestos', icon: 'chart', color: '#9F7BFF', title: 'Presupuestos',
    intro: 'Decide cuánto quieres gastar por categoría cada mes y monitorea en tiempo real si vas bien o te estás pasando.',
    steps: [
      { t: 'Crear un presupuesto', d: 'Ve a Presupuestos y toca "+". Selecciona la categoría, la moneda del presupuesto y el límite mensual. Un presupuesto por categoría.' },
      { t: 'Barra de progreso', d: 'Cada presupuesto muestra el gasto actual vs. el límite con una barra de progreso. Amarillo al superar 80%, rojo si excedes el límite.' },
      { t: 'Cálculo automático', d: 'CoinDev suma automáticamente todos los gastos de esa categoría en el mes actual. Sin intervención manual de tu parte.' },
      { t: 'Editar presupuestos', d: 'Usa el menú (⋯) para editar el límite mensual. Para cambiar la categoría, elimina y crea uno nuevo.' },
    ],
    tips: ['Empieza con las categorías donde más gastas', 'Revisa semanalmente para ajustar el ritmo', 'Un presupuesto de "Varios" te ayuda a capturar gastos inesperados'],
  },
  {
    id: 'metas', icon: 'target', color: '#FF8BB5', title: 'Metas de ahorro',
    intro: 'Define tus objetivos financieros y ve exactamente cuánto falta y cuánto deberías ahorrar por mes para llegar.',
    steps: [
      { t: 'Crear una meta', d: 'Ve a Metas y toca "+". Elige ícono y nombre, selecciona la moneda de la meta, el monto objetivo y opcionalmente una fecha límite.' },
      { t: 'Abonar a una meta', d: 'Toca "Abonar" en cualquier meta activa. Selecciona la cuenta de origen e ingresa el monto. Si la cuenta tiene moneda distinta a la meta, verás la equivalencia antes de confirmar.' },
      { t: 'Conversión automática', d: 'Si tu cuenta es CRC y tu meta en USD (o al revés), CoinDev muestra el equivalente usando el tipo de cambio en tiempo real y pide confirmación antes de procesar.' },
      { t: 'Estados de la meta', d: 'Activa, Pausada o Completada. Cambia el estado desde edición. Historial de todos los abonos disponible en la card expandida.' },
    ],
    tips: ['Metas específicas ("Viaje a Europa 2026") funcionan mejor que genéricas', 'CoinDev calcula el ahorro mensual necesario para llegar a tiempo', 'El historial de abonos te muestra tu progreso real'],
  },
  {
    id: 'gastos-fijos', icon: 'repeat', color: '#F2C94C', title: 'Gastos fijos',
    intro: 'Todos tus pagos recurrentes en un solo lugar — alquiler, suscripciones, servicios. Nunca más olvides un vencimiento.',
    steps: [
      { t: '¿Qué es un gasto fijo?', d: 'Es cualquier pago que se repite: mensual, semanal o personalizado. Al crear un movimiento y activar "Gasto fijo", aparece automáticamente en este módulo.' },
      { t: 'Ver vencimientos', d: 'La pantalla muestra todos los gastos recurrentes con nombre, monto, frecuencia y fecha del próximo pago. Los próximos a vencer se destacan visualmente.' },
      { t: 'Frecuencias', d: 'Mensual: mismo día de cada mes. Semanal: mismo día de cada semana. Personalizado: define los días exactos entre pagos (ej: cada 15 días).' },
      { t: 'Gestionar gastos fijos', d: 'Edita monto o frecuencia desde el menú de opciones. Si cancelas una suscripción en la vida real, elimínala de aquí para mantener datos limpios.' },
    ],
    tips: ['Revisa esta sección al inicio de cada mes', 'Agrupa los vencimientos por fecha para planificar tu flujo de caja', 'Si cancelas Netflix, elimínalo de inmediato de la lista'],
  },
  {
    id: 'reportes', icon: 'trending', color: '#5BE5D1', title: 'Reportes',
    intro: 'Entiende cómo ha evolucionado tu dinero en los últimos 12 meses con gráficas claras y datos reales.',
    steps: [
      { t: 'Evolución anual', d: 'La gráfica de barras muestra mes a mes tus ingresos (verde) vs gastos (rojo) en los últimos 12 meses. Identifica de un vistazo los meses buenos y malos.' },
      { t: 'Totales del período', d: 'Arriba de la gráfica: ingresos totales acumulados, gastos totales y balance neto del año. Todo en CRC para comparación uniforme.' },
      { t: 'Filtro mensual', d: 'Toca cualquier mes en la gráfica para ver el detalle de ese período: desglose por categoría y lista de movimientos de ese mes.' },
      { t: 'Interpretación', d: 'Verde > Rojo = mes positivo (ahorraste). Rojo > Verde = gastaste más que lo que ganaste. Patrón consistente de ahorro = finanzas saludables.' },
    ],
    tips: ['Revisa los reportes una vez al mes', 'Compara el mismo mes de años distintos para ver tu progreso', 'Usa los datos para ajustar presupuestos el mes siguiente'],
  },
];

function Manual() {
  const [activeId, setActiveId] = useState('cuentas');
  const active = MODULES.find(m => m.id === activeId)!;

  return (
    <section id="manual" style={{ padding: '96px 24px', background: '#0C111B', borderTop: '1px solid #232A3D', borderBottom: '1px solid #232A3D' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <SectionBadge text="Manual de usuario" />
        <h2 style={sectionTitle}>Aprende a usar cada módulo</h2>
        <p style={sectionSub}>Guía completa con paso a paso, ejemplos y tips para aprovechar CoinDev al máximo desde el primer día.</p>

        {/* Module tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
          {MODULES.map(m => (
            <button key={m.id} onClick={() => setActiveId(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 999,
              background: activeId === m.id ? m.color + '18' : '#10141F',
              border: `1.5px solid ${activeId === m.id ? m.color + '55' : '#232A3D'}`,
              color: activeId === m.id ? m.color : '#9098AE',
              fontSize: 13, fontWeight: activeId === m.id ? 600 : 400,
              cursor: 'pointer', transition: 'all 140ms',
            }}>
              <Icon name={m.icon} size={14} color={activeId === m.id ? m.color : undefined} />
              {m.title}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div style={{ background: '#10141F', border: '1px solid #232A3D', borderRadius: 24, padding: '36px', maxWidth: 820, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #232A3D' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: active.color + '18', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={active.icon} size={24} color={active.color} />
            </div>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#EDF0F7', letterSpacing: '-0.03em', marginBottom: 6 }}>{active.title}</h3>
              <p style={{ fontSize: 13.5, color: '#626B85', lineHeight: 1.55 }}>{active.intro}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
            {active.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: active.color + '18', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: active.color }}>{i + 1}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#EDF0F7', marginBottom: 5 }}>{step.t}</div>
                  <div style={{ fontSize: 13.5, color: '#9098AE', lineHeight: 1.65 }}>{step.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: active.color + '0C', border: `1px solid ${active.color}22`, borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: active.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>💡 Tips profesionales</div>
            {active.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < active.tips.length - 1 ? 8 : 0 }}>
                <Icon name="check" size={14} color={active.color} />
                <span style={{ fontSize: 13, color: '#9098AE', lineHeight: 1.55 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How it works ───────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: '01', icon: 'wallet', color: '#5B9BFF', title: 'Crea tus cuentas', desc: 'Agrega cada cuenta bancaria, tarjeta o cartera con su saldo actual y moneda. Solo toma 2 minutos.' },
    { n: '02', icon: 'swap',   color: '#4FE0A9', title: 'Registra movimientos', desc: 'Cada vez que ganes o gastes, agrégalo. Con categorías inteligentes verás el patrón de tus finanzas en días.' },
    { n: '03', icon: 'chart',  color: '#9F7BFF', title: 'Controla y planifica', desc: 'Revisa reportes, ajusta presupuestos y ahorra hacia tus metas. Tus finanzas, finalmente bajo control.' },
  ];
  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <SectionBadge text="Cómo funciona" />
        <h2 style={sectionTitle}>En 3 pasos, listo</h2>
        <p style={sectionSub}>Sin configuraciones complicadas. En menos de 5 minutos tienes CoinDev funcionando con datos reales.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: '#10141F', border: '1px solid #232A3D', borderRadius: 20, padding: '32px 28px' }}>
              <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 20 }}>{s.n}</div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.color + '18', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
                <Icon name={s.icon} size={18} color={s.color} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#EDF0F7', marginBottom: 10, letterSpacing: '-0.02em' }}>{s.title}</div>
              <div style={{ fontSize: 13.5, color: '#626B85', lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ────────────────────────────────────────────────────────── */
const PLAN_FEATURES = [
  'Cuentas ilimitadas en cualquier moneda',
  'Movimientos y categorías ilimitados',
  'Presupuestos mensuales por categoría',
  'Metas de ahorro con conversión automática',
  'Gastos fijos y recurrentes',
  'Reportes y análisis 12 meses',
  'Tipo de cambio en tiempo real (USD/CRC)',
  'PWA — funciona como app nativa en iOS/Android',
  'Soporte por email en español e inglés',
  'Datos cifrados y privados (Row-Level Security)',
];

function Pricing() {
  return (
    <section id="pricing" style={{ padding: '96px 24px', background: '#0C111B', borderTop: '1px solid #232A3D' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <SectionBadge text="Precio" />
        <h2 style={sectionTitle}>Un plan. Todo incluido.</h2>
        <p style={sectionSub}>Sin niveles confusos, sin límites ocultos. Una tarifa fija y acceso completo desde el día uno.</p>

        <div style={{ background: '#10141F', border: '1px solid #232A3D', borderRadius: 24, padding: '40px 36px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(91,155,255,0.08), 0 32px 80px -16px rgba(0,0,0,0.7)', textAlign: 'left' }}>
          {/* Top gradient line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)' }} />

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#626B85', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Plan Pro · Todo incluido</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#626B85', alignSelf: 'flex-start', marginTop: 10 }}>$</span>
              <span style={{ fontSize: 68, fontWeight: 800, letterSpacing: '-0.05em', color: '#EDF0F7', lineHeight: 1 }}>4.99</span>
              <span style={{ fontSize: 18, color: '#626B85', marginBottom: 10 }}>/mes</span>
            </div>
            <div style={{ fontSize: 13.5, color: '#626B85', marginBottom: 22 }}>≈ ₡2,500 CRC · Cancela cuando quieras</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 999, background: 'rgba(79,224,169,0.1)', border: '1px solid rgba(79,224,169,0.2)' }}>
              <Icon name="zap" size={14} color="#4FE0A9" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4FE0A9' }}>7 días de prueba gratuita · Sin tarjeta</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {PLAN_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(79,224,169,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Icon name="check" size={10} color="#4FE0A9" />
                </div>
                <span style={{ fontSize: 13.5, color: '#9098AE', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>

          <a href={CHECKOUT_URL} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color: '#0C0E14', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(91,155,255,0.3)' }}>
            Comenzar prueba gratuita <Icon name="arrow" size={16} color="#0C0E14" />
          </a>
          <p style={{ marginTop: 14, fontSize: 12, color: '#424A62', textAlign: 'center' }}>
            Pago seguro procesado por Lemon Squeezy · Sin compromisos
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────────────── */
const FAQS = [
  { q: '¿Necesito tarjeta para la prueba gratuita?', a: 'No. Los 7 días de prueba son 100% gratis y no requieren ningún dato de pago. Al finalizar, se te invitará a suscribirte para continuar.' },
  { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, sin preguntas ni penalizaciones. Tu suscripción se cancela de inmediato desde tu panel de Lemon Squeezy. Tus datos permanecen hasta el final del período pagado.' },
  { q: '¿Mis datos financieros están seguros?', a: 'Absolutamente. CoinDev usa Supabase con Row-Level Security (RLS). Tus datos son estrictamente privados — ni el equipo de CoinDev puede acceder a ellos.' },
  { q: '¿Funciona en mi teléfono?', a: 'CoinDev es una Progressive Web App (PWA). Instálala desde tu navegador en iOS o Android y funciona como una app nativa, desde la pantalla de inicio.' },
  { q: '¿Qué monedas soporta?', a: 'Soporta 18 monedas: CRC, USD, MXN, GTQ, HNL, NIO, COP, PEN, BOB, CLP, ARS, UYU, PYG, DOP, SVC, BZD, VES y EUR. El tipo de cambio USD/CRC se actualiza en tiempo real.' },
  { q: '¿Pierdo mis datos si cancelo?', a: 'No. Tus datos se conservan aunque tu cuenta expire. Al reactivar, todo estará exactamente como lo dejaste: cuentas, movimientos, metas y presupuestos.' },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <SectionBadge text="FAQ" />
        <h2 style={sectionTitle}>Preguntas frecuentes</h2>
        <p style={sectionSub}>Todo lo que necesitas saber antes de empezar.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((f, i) => (
            <div key={i} style={{ background: '#10141F', border: `1px solid ${open === i ? '#5B9BFF44' : '#232A3D'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 200ms' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: '#EDF0F7', lineHeight: 1.4 }}>{f.q}</span>
                <span style={{ transform: open === i ? 'rotate(90deg)' : 'none', transition: 'transform 200ms', flexShrink: 0, color: '#626B85' }}>
                  <Icon name="arrow" size={16} />
                </span>
              </button>
              {open === i && (
                <div style={{ padding: '0 20px 20px', fontSize: 13.5, color: '#9098AE', lineHeight: 1.7 }}>{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ──────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ padding: '80px 24px', background: '#0C111B', borderTop: '1px solid #232A3D', textAlign: 'center' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="CoinDev" width={64} height={64} style={{ borderRadius: 16, marginBottom: 24 }} />
        <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', color: '#EDF0F7', marginBottom: 16, lineHeight: 1.1 }}>
          Empieza hoy. Gratis.<br />
          <span style={{ background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sin excusas.</span>
        </h2>
        <p style={{ fontSize: 16, color: '#626B85', marginBottom: 32, lineHeight: 1.65 }}>
          7 días gratis, sin tarjeta. Cancela cuando quieras. Tus datos, siempre tuyos — incluso si cancelas.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
          <a href={CHECKOUT_URL} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, background: 'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color: '#0C0E14', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(91,155,255,0.25)' }}>
            Comenzar prueba gratuita <Icon name="arrow" size={16} color="#0C0E14" />
          </a>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, background: '#10141F', color: '#9098AE', border: '1px solid #232A3D', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────── */
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ borderTop: '1px solid #232A3D', padding: '40px 24px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="CoinDev" width={24} height={24} style={{ borderRadius: 6 }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: '#EDF0F7', letterSpacing: '-0.03em' }}>CoinDev</span>
            </div>
            <p style={{ fontSize: 13, color: '#424A62', maxWidth: 260, lineHeight: 1.6 }}>
              Finanzas personales diseñadas para LATAM. Control total de tu dinero, en tu idioma.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#424A62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Producto</div>
              {[{h:'#features',l:'Características'},{h:'#manual',l:'Manual'},{h:'#pricing',l:'Precio'},{h:'#faq',l:'FAQ'}].map(x => (
                <a key={x.h} href={x.h} style={{ display: 'block', fontSize: 13, color: '#626B85', textDecoration: 'none', marginBottom: 8, transition: 'color 140ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9098AE')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#626B85')}>{x.l}</a>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#424A62', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Cuenta</div>
              {[{h:'/login',l:'Iniciar sesión'},{h:'/register',l:'Registrarse'},{h:CHECKOUT_URL,l:'Prueba gratis'}].map(x => (
                <a key={x.h} href={x.h} style={{ display: 'block', fontSize: 13, color: '#626B85', textDecoration: 'none', marginBottom: 8, transition: 'color 140ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9098AE')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#626B85')}>{x.l}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1D2336', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#424A62' }}>© {year} CoinDev. Todos los derechos reservados.</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="lock" size={12} color="#424A62" />
            <span style={{ fontSize: 12, color: '#424A62' }}>Pagos seguros con Lemon Squeezy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function SectionBadge({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 999, background: '#10141F', border: '1px solid #232A3D' }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#626B85', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{text}</span>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: '-0.04em',
  color: '#EDF0F7', textAlign: 'center', marginBottom: 14, lineHeight: 1.1,
};
const sectionSub: React.CSSProperties = {
  fontSize: 'clamp(14px,2vw,17px)', color: '#626B85', textAlign: 'center',
  maxWidth: 520, margin: '0 auto 56px', lineHeight: 1.65,
};

/* ── Page ───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#07090F', color: '#EDF0F7' }}>
      <style>{`html { scroll-behavior: smooth; } * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Manual />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
