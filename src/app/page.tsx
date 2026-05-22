'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

const CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ?? '#pricing';

/* ─── SVG Paths ────────────────────────────────────────────────────── */
const P: Record<string, string[]> = {
  arrow:    ['M5 12h14M12 5l7 7-7 7'],
  check:    ['M20 6 9 17l-5-5'],
  menu:     ['M4 6h16M4 12h16M4 18h16'],
  x:        ['M18 6 6 18M6 6l12 12'],
  zap:      ['M13 2 3 14h9l-1 8 10-12h-9l1-8z'],
  lock:     ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z','M7 11V7a5 5 0 0 1 10 0v4'],
  shield:   ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  trending: ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  wallet:   ['M21 12V7H5a2 2 0 0 1 0-4h14v4','M3 5v14a2 2 0 0 0 2 2h16v-5','M18 12a2 2 0 0 0 0 4h4v-4z'],
  swap:     ['M7 16V4m0 0L3 8m4-4 4 4','M17 8v12m0 0 4-4m-4 4-4-4'],
  chart:    ['M3 3v18h18','M18 9l-5 5-4-4-4 4'],
  target:   ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z'],
  repeat:   ['M17 1l4 4-4 4','M3 11V9a4 4 0 0 1 4-4h14','M7 23l-4-4 4-4','M21 13v2a4 4 0 0 1-4 4H3'],
  dollar:   ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  barChart: ['M12 20V10','M18 20V4','M6 20v-4'],
  pie:      ['M21.21 15.89A10 10 0 1 1 8 2.83','M22 12A10 10 0 0 0 12 2v10z'],
  bell:     ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0'],
};
function Ic({ n, size = 16, stroke = 1.7, col }: { n: string; size?: number; stroke?: number; col?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={col ?? 'currentColor'} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
      {(P[n] ?? P.arrow).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

/* ─── Ticker ────────────────────────────────────────────────────────── */
const RATES = [
  { pair: 'USD/CRC', rate: '512.34', delta: '+0.42', up: true },
  { pair: 'USD/MXN', rate: '17.18',  delta: '-0.09', up: false },
  { pair: 'USD/PEN', rate: '3.762',  delta: '+0.014', up: true },
  { pair: 'USD/COP', rate: '4,128',  delta: '-2.10', up: false },
  { pair: 'USD/BRL', rate: '5.082',  delta: '-0.022', up: false },
  { pair: 'USD/ARS', rate: '987.50', delta: '+1.30', up: true },
  { pair: 'USD/CLP', rate: '934.20', delta: '+3.10', up: true },
  { pair: 'USD/GTQ', rate: '7.750',  delta: '+0.004', up: true },
  { pair: 'USD/UYU', rate: '39.85',  delta: '-0.12', up: false },
  { pair: 'EUR/USD', rate: '1.0842', delta: '+0.002', up: true },
];

function Ticker() {
  return (
    <div style={{ background: '#0A0D16', borderBottom: '1px solid #1A1F2E', overflow: 'hidden', height: 36, display: 'flex', alignItems: 'center' }}>
      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-track { display: flex; gap: 0; animation: ticker 38s linear infinite; width: max-content; }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="ticker-track">
        {[...RATES, ...RATES].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 28px', borderRight: '1px solid #1A1F2E', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#5B9BFF', letterSpacing: '0.04em' }}>{r.pair}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#C8D0E4' }}>{r.rate}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: r.up ? '#4FE0A9' : '#FF6B83', display: 'flex', alignItems: 'center', gap: 2 }}>
              {r.up ? '▲' : '▼'} {r.delta}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Navbar ────────────────────────────────────────────────────────── */
function Navbar() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = ['Producto','Módulos','Divisas','Seguridad','Precio'];
  const hrefs = ['#hero','#modulos','#divisas','#seguridad','#pricing'];

  return (
    <>
      <style>{`
        .nav-link { font-size:14px; font-weight:500; color:#9098AE; text-decoration:none; transition:color 140ms; padding:4px 0; }
        .nav-link:hover { color:#EDF0F7; }
        @media(max-width:860px){ .nd{ display:none!important; } .nb{ display:flex!important; } }
        .nb{ display:none; }
      `}</style>
      <nav style={{ position:'fixed', top:36, left:0, right:0, zIndex:100, background: scrolled ? 'rgba(6,8,14,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid #1A1F2E' : '1px solid transparent', transition:'all 220ms' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 28px', height:60, display:'flex', alignItems:'center', gap:32 }}>
          <a href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none', flexShrink:0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="CoinDev" width={28} height={28} style={{ borderRadius:7 }} />
            <span style={{ fontSize:17, fontWeight:800, color:'#EDF0F7', letterSpacing:'-0.03em' }}><span style={{ color:'#EDF0F7' }}>Coin</span><span style={{ color:'#5B9BFF' }}>Dev</span></span>
          </a>
          <div className="nd" style={{ display:'flex', alignItems:'center', gap:24, flex:1, justifyContent:'center' }}>
            {links.map((l,i) => <a key={l} href={hrefs[i]} className="nav-link">{l}</a>)}
          </div>
          <div className="nd" style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            {loggedIn ? (
              <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 20px', borderRadius:8, background:'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color:'#06080E', fontSize:13.5, fontWeight:700, textDecoration:'none' }}>
                Ir al app <Ic n="arrow" size={14} col="#06080E" />
              </Link>
            ) : (
              <>
                <Link href="/login" style={{ fontSize:13.5, fontWeight:500, color:'#9098AE', textDecoration:'none', padding:'8px 16px', borderRadius:8, border:'1px solid #1A1F2E', transition:'all 140ms', background:'transparent' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor='#2A3145';(e.currentTarget as HTMLAnchorElement).style.color='#EDF0F7';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor='#1A1F2E';(e.currentTarget as HTMLAnchorElement).style.color='#9098AE';}}>
                  Iniciar sesión
                </Link>
                <a href={CHECKOUT_URL} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 20px', borderRadius:8, background:'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color:'#06080E', fontSize:13.5, fontWeight:700, textDecoration:'none', boxShadow:'0 0 20px rgba(91,155,255,0.25)' }}>
                  Crear cuenta gratis <Ic n="arrow" size={13} col="#06080E" />
                </a>
              </>
            )}
          </div>
          <button className="nb" onClick={()=>setMob(v=>!v)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#9098AE', padding:4 }}>
            <Ic n={mob?'x':'menu'} size={22} />
          </button>
        </div>
        {mob && (
          <div style={{ background:'#0C0F1A', borderTop:'1px solid #1A1F2E', padding:'16px 28px 24px' }}>
            {links.map((l,i)=>(
              <a key={l} href={hrefs[i]} onClick={()=>setMob(false)} style={{ display:'block', padding:'12px 0', fontSize:15, fontWeight:500, color:'#9098AE', textDecoration:'none', borderBottom:'1px solid #1A1F2E' }}>{l}</a>
            ))}
            <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:10 }}>
              <Link href="/login" style={{ textAlign:'center', padding:'12px', borderRadius:8, border:'1px solid #1A1F2E', color:'#9098AE', fontSize:14, fontWeight:600, textDecoration:'none' }}>Iniciar sesión</Link>
              <a href={CHECKOUT_URL} style={{ textAlign:'center', padding:'12px', borderRadius:8, background:'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color:'#06080E', fontSize:14, fontWeight:700, textDecoration:'none' }}>Crear cuenta gratis →</a>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section id="hero" style={{ paddingTop:130, paddingBottom:80, position:'relative', overflow:'hidden' }}>
      {/* BG glows */}
      <div style={{ position:'absolute', top:'-10%', right:'-5%', width:700, height:700, background:'radial-gradient(circle, rgba(91,155,255,0.07) 0%, transparent 65%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'10%', left:'-10%', width:500, height:500, background:'radial-gradient(circle, rgba(91,229,209,0.05) 0%, transparent 65%)', pointerEvents:'none' }} />

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 28px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
        {/* Left */}
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 12px', borderRadius:6, background:'rgba(79,224,169,0.08)', border:'1px solid rgba(79,224,169,0.2)', marginBottom:28 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#4FE0A9', boxShadow:'0 0 6px #4FE0A9' }} />
            <span style={{ fontSize:12, fontWeight:600, color:'#4FE0A9', letterSpacing:'0.04em' }}>Construida para LATAM · v2.5 en producción</span>
          </div>

          <h1 style={{ fontSize:'clamp(38px,4.5vw,62px)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.07, color:'#EDF0F7', marginBottom:24 }}>
            Tus finanzas,{' '}
            <span style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,rgba(91,229,209,0.12),rgba(91,155,255,0.12))', border:'1px solid rgba(91,155,255,0.25)', borderRadius:10, padding:'2px 14px', fontFamily:'var(--font-mono)', color:'#5B9BFF' }}>
              &lt;/&gt; multimoneda
            </span>
            <br />
            <span style={{ background:'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              precisión absoluta.
            </span>
          </h1>

          <p style={{ fontSize:'clamp(15px,1.6vw,17px)', color:'#7A82A0', lineHeight:1.7, maxWidth:480, marginBottom:36 }}>
            CoinDev es la app de finanzas personales pensada para América Latina. Registrá ingresos, controlá presupuestos, alcanzá metas y manejá pesos, soles, colones y dólares con tipos de cambio en vivo — todo en un solo lugar.
          </p>

          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:36 }}>
            <a href={CHECKOUT_URL} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 26px', borderRadius:9, background:'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color:'#06080E', fontSize:14.5, fontWeight:700, textDecoration:'none', boxShadow:'0 8px 28px rgba(91,155,255,0.3)' }}>
              Crear cuenta gratis <Ic n="arrow" size={15} col="#06080E" />
            </a>
            <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 22px', borderRadius:9, background:'transparent', color:'#9098AE', border:'1px solid #1A1F2E', fontSize:14.5, fontWeight:600, textDecoration:'none' }}>
              Iniciar sesión
            </Link>
          </div>

          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {[{icon:'shield',txt:'Sin tarjeta requerida'},{icon:'lock',txt:'Datos 100% privados'},{icon:'zap',txt:'7 días gratis'}].map(b=>(
              <div key={b.txt} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Ic n={b.icon} size={14} col="#5B9BFF" />
                <span style={{ fontSize:12.5, color:'#626B85', fontWeight:500 }}>{b.txt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — App mockup */}
        <HeroMockup />
      </div>

      {/* Responsive hero */}
      <style>{`@media(max-width:860px){ .hero-grid{ grid-template-columns:1fr!important; } .hero-mockup{ display:none!important; } }`}</style>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="hero-mockup" style={{ position:'relative' }}>
      {/* Floating "ahorro este mes" badge */}
      <div style={{ position:'absolute', top:-18, right:20, zIndex:10, background:'rgba(16,20,31,0.95)', border:'1px solid #232A3D', borderRadius:12, padding:'10px 16px', backdropFilter:'blur(12px)', boxShadow:'0 12px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#626B85', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Ahorro este mes</div>
        <div style={{ fontSize:20, fontWeight:800, color:'#4FE0A9', letterSpacing:'-0.03em' }}>+₡ 653,000</div>
      </div>

      <div style={{ background:'#0D1120', border:'1px solid #1A1F2E', borderRadius:18, overflow:'hidden', boxShadow:'0 32px 80px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)' }}>
        {/* Nav tabs */}
        <div style={{ background:'#0A0D18', padding:'14px 20px', display:'flex', alignItems:'center', gap:4, borderBottom:'1px solid #1A1F2E' }}>
          {['Inicio','Movimientos','Cuentas','Reportes'].map((t,i)=>(
            <button key={t} style={{ padding:'6px 14px', borderRadius:7, fontSize:12.5, fontWeight: i===0?600:400, color: i===0?'#EDF0F7':'#626B85', background: i===0?'#161C2E':'transparent', border:'none', cursor:'pointer' }}>{t}</button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
            {['#5B9BFF','#4FE0A9','#9F7BFF'].map(c=><div key={c} style={{ width:9, height:9, borderRadius:'50%', background:c, opacity:0.7 }} />)}
          </div>
        </div>

        <div style={{ padding:20 }}>
          {/* Balance header */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'#424A62', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:6 }}>BALANCE NETO · NOVIEMBRE</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:12 }}>
              <span style={{ fontSize:34, fontWeight:800, letterSpacing:'-0.04em', color:'#EDF0F7', fontFamily:'var(--font-mono)' }}>₡ 2,847,500</span>
              <div style={{ marginBottom:6, display:'flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:6, background:'rgba(79,224,169,0.12)', border:'1px solid rgba(79,224,169,0.2)' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#4FE0A9' }}>↑ 12.4%</span>
              </div>
            </div>
          </div>

          {/* Cards row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <div style={{ background:'#0A0D18', border:'1px solid #1A1F2E', borderRadius:12, padding:'14px' }}>
              <div style={{ fontSize:10, color:'#424A62', fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:8 }}>INGRESOS</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#4FE0A9', letterSpacing:'-0.02em', marginBottom:8, fontFamily:'var(--font-mono)' }}>+₡ 1,900,000</div>
              <Sparkline color="#4FE0A9" data={[30,55,42,70,58,82,65,90,72,88,75,95]} />
            </div>
            <div style={{ background:'#0A0D18', border:'1px solid #1A1F2E', borderRadius:12, padding:'14px' }}>
              <div style={{ fontSize:10, color:'#424A62', fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:8 }}>GASTOS</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#FF6B83', letterSpacing:'-0.02em', marginBottom:8, fontFamily:'var(--font-mono)' }}>-₡ 1,247,000</div>
              <Sparkline color="#FF6B83" data={[80,60,75,45,65,40,55,70,50,60,45,52]} />
            </div>
          </div>

          {/* Donut + categories */}
          <div style={{ background:'#0A0D18', border:'1px solid #1A1F2E', borderRadius:12, padding:'14px', display:'flex', alignItems:'center', gap:20 }}>
            <DonutChart />
            <div style={{ flex:1 }}>
              {[{l:'Vivienda',pct:32,c:'#5B9BFF'},{l:'Comida',pct:24,c:'#9F7BFF'},{l:'Transporte',pct:18,c:'#4FE0A9'},{l:'Ocio',pct:14,c:'#FF8BB5'}].map(cat=>(
                <div key={cat.l} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:cat.c }} />
                    <span style={{ fontSize:11.5, color:'#9098AE' }}>{cat.l}</span>
                  </div>
                  <span style={{ fontSize:11.5, fontWeight:600, color:'#626B85', fontFamily:'var(--font-mono)' }}>{cat.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ color, data }: { color: string; data: number[] }) {
  const w = 120, h = 32;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
    </svg>
  );
}

function DonutChart() {
  const segments = [
    { pct: 32, color: '#5B9BFF' },
    { pct: 24, color: '#9F7BFF' },
    { pct: 18, color: '#4FE0A9' },
    { pct: 14, color: '#FF8BB5' },
    { pct: 12, color: '#F2C94C' },
  ];
  const r = 28, cx = 36, cy = 36, gap = 2;
  let angle = -90;
  const paths = segments.map(s => {
    const a1 = angle, a2 = angle + (s.pct / 100) * 360 - gap;
    angle += (s.pct / 100) * 360;
    const x1 = cx + r * Math.cos((a1 * Math.PI) / 180);
    const y1 = cy + r * Math.sin((a1 * Math.PI) / 180);
    const x2 = cx + r * Math.cos((a2 * Math.PI) / 180);
    const y2 = cy + r * Math.sin((a2 * Math.PI) / 180);
    const large = a2 - a1 > 180 ? 1 : 0;
    return <path key={s.color} d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={s.color} strokeWidth={8} strokeLinecap="round" />;
  });
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A1F2E" strokeWidth={8} />
      {paths}
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize={14} fontWeight={800} fill="#EDF0F7">6</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize={7} fill="#626B85">CAT.</text>
    </svg>
  );
}

/* ─── Module Section ─────────────────────────────────────────────────── */
function Modules() {
  return (
    <section id="modulos" style={{ padding:'100px 28px', background:'#06080E' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom:60 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ width:32, height:1, background:'#5B9BFF' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'#5B9BFF', textTransform:'uppercase', letterSpacing:'0.12em' }}>SEIS MÓDULOS · UNA SOLA APP</span>
          </div>
          <h2 style={{ fontSize:'clamp(30px,3.5vw,50px)', fontWeight:800, letterSpacing:'-0.04em', color:'#EDF0F7', lineHeight:1.1, maxWidth:680 }}>
            Todo lo que necesitás para entender, decidir y crecer financieramente.
          </h2>
          <p style={{ fontSize:'clamp(14px,1.6vw,17px)', color:'#626B85', lineHeight:1.7, maxWidth:560, marginTop:16 }}>
            Desde el primer movimiento hasta tu meta de un año. CoinDev une cuentas, presupuestos, metas y divisas en flujos diseñados para el día a día latinoamericano.
          </p>
        </div>

        {/* Top 2 big cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <ModuleCard
            path="/dashboard/movimientos"
            icon="swap" color="#5B9BFF"
            title="Movimientos con contexto"
            desc="Cada ingreso o gasto categorizado, fechado y asociado a una cuenta. Filtrá, buscá y exportá tu historial completo."
            mockup={<MovimientosMock />}
          />
          <ModuleCard
            path="/dashboard/cuentas"
            icon="wallet" color="#4FE0A9"
            title="Cuentas multi-moneda"
            desc="Bancarias, ahorro, efectivo y tarjetas. Cada cuenta en su moneda nativa. El dashboard consolida todo en CRC o USD."
            mockup={<CuentasMock />}
          />
        </div>

        {/* Bottom 3 cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
          <ModuleCard
            path="/dashboard/presupuestos"
            icon="chart" color="#9F7BFF"
            title="Presupuestos con alerta"
            desc="Definí límites por categoría y CoinDev te avisa al 80%."
            mockup={<PresupuestosMock />}
          />
          <ModuleCard
            path="/dashboard/metas"
            icon="target" color="#FF8BB5"
            title="Metas con aportes reales"
            desc="Cada abono descuenta de una cuenta y suma al progreso. Con historial."
            mockup={<MetasMock />}
          />
          <ModuleCard
            path="/dashboard/gastos-fijos"
            icon="repeat" color="#F2C94C"
            title="Gastos fijos sin sorpresas"
            desc="Alquiler, suscripciones, servicios. Próxima fecha y total comprometido."
            mockup={<GastosFijosMock />}
          />
        </div>

        {/* Bottom 2 cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <ModuleCard
            path="/dashboard"
            icon="dollar" color="#5BE5D1"
            title="Tipos de cambio, en vivo"
            desc="USD, EUR y más divisas LATAM sincronizadas. El total de tus cuentas se convierte automáticamente para comparación unificada."
            mockup={<DivisasMock />}
          />
          <ModuleCard
            path="/dashboard/reportes"
            icon="barChart" color="#5B9BFF"
            title="Reportes que sí entendés"
            desc="Evolución anual de ingresos vs gastos, desglose por categoría y tendencias. Decisiones con datos, no con corazonadas."
            mockup={<ReportesMock />}
          />
        </div>
      </div>

      <style>{`
        @media(max-width:860px){
          .mod-top{ grid-template-columns:1fr!important; }
          .mod-bot3{ grid-template-columns:1fr!important; }
          .mod-bot2{ grid-template-columns:1fr!important; }
        }
      `}</style>
    </section>
  );
}

function ModuleCard({ path, icon, color, title, desc, mockup }: {
  path: string; icon: string; color: string; title: string; desc: string; mockup: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background:'#0D1120', border:`1px solid ${hov ? color+'33' : '#1A1F2E'}`, borderRadius:18, padding:'24px', transition:'border-color 200ms, transform 200ms', transform: hov ? 'translateY(-2px)' : 'none', overflow:'hidden' }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#424A62', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>{path}</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:color+'18', display:'grid', placeItems:'center' }}>
          <Ic n={icon} size={18} col={color} />
        </div>
      </div>
      <h3 style={{ fontSize:18, fontWeight:700, color:'#EDF0F7', letterSpacing:'-0.025em', marginBottom:8, lineHeight:1.25 }}>{title}</h3>
      <p style={{ fontSize:13, color:'#626B85', lineHeight:1.65, marginBottom:20 }}>{desc}</p>
      <div style={{ borderTop:'1px solid #1A1F2E', paddingTop:18 }}>{mockup}</div>
    </div>
  );
}

/* ─── Module mini-mockups ─────────────────────────────────────────────── */
function MovimientosMock() {
  const items = [
    { cat:'Salario', amount:'+₡950,000', color:'#4FE0A9', date:'30 nov' },
    { cat:'Supermercado', amount:'-₡48,500', color:'#FF6B83', date:'28 nov' },
    { cat:'Netflix', amount:'-₡9,500', color:'#FF6B83', date:'25 nov' },
    { cat:'Freelance', amount:'+₡180,000', color:'#4FE0A9', date:'22 nov' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {items.map((t,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:t.color, flexShrink:0 }} />
            <span style={{ fontSize:12, color:'#9098AE' }}>{t.cat}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:10, color:'#424A62' }}>{t.date}</span>
            <span style={{ fontSize:12, fontWeight:700, color:t.color, fontFamily:'var(--font-mono)' }}>{t.amount}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CuentasMock() {
  const accs = [
    { name:'BAC Colones', bal:'₡1,240,000', color:'#5B9BFF' },
    { name:'BAC Dólares', bal:'$1,200', color:'#4FE0A9' },
    { name:'Efectivo', bal:'₡85,000', color:'#F2C94C' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {accs.map((a,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'#0A0D18', borderRadius:10, border:'1px solid #1A1F2E' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:a.color+'22', display:'grid', placeItems:'center' }}>
              <div style={{ width:9, height:9, borderRadius:'50%', background:a.color }} />
            </div>
            <span style={{ fontSize:12.5, fontWeight:600, color:'#C8D0E4' }}>{a.name}</span>
          </div>
          <span style={{ fontSize:12.5, fontWeight:700, color:'#EDF0F7', fontFamily:'var(--font-mono)' }}>{a.bal}</span>
        </div>
      ))}
    </div>
  );
}

function PresupuestosMock() {
  const items = [
    { cat:'Comida', spent:4200, limit:5400, color:'#9F7BFF' },
    { cat:'Transporte', spent:2600, limit:2700, color:'#F2C94C' },
    { cat:'Ocio', spent:1000, limit:3000, color:'#5B9BFF' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {items.map((b,i)=>{
        const pct = Math.min(100, (b.spent/b.limit)*100);
        const over = pct > 80;
        return (
          <div key={i}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ fontSize:12, color:'#9098AE' }}>{b.cat}</span>
              <span style={{ fontSize:11, color:'#626B85', fontFamily:'var(--font-mono)' }}>$ {(b.spent/1000).toFixed(1)}k / {(b.limit/1000).toFixed(1)}k</span>
            </div>
            <div style={{ height:5, background:'#1A1F2E', borderRadius:999, overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background: over ? b.color : b.color, borderRadius:999, opacity: over ? 1 : 0.7 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetasMock() {
  const r = 32, cx = 40, cy = 40;
  const pct = 62;
  const angle = (pct / 100) * 360 - 90;
  const x2 = cx + r * Math.cos((angle * Math.PI) / 180);
  const y2 = cy + r * Math.sin((angle * Math.PI) / 180);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20 }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A1F2E" strokeWidth={7} />
        <path d={`M ${cx} ${cy-r} A ${r} ${r} 0 ${pct>50?1:0} 1 ${x2} ${y2}`} fill="none" stroke="#FF8BB5" strokeWidth={7} strokeLinecap="round" />
        <text x={cx} y={cy-2} textAnchor="middle" fontSize={14} fontWeight={800} fill="#EDF0F7">{pct}%</text>
        <text x={cx} y={cy+10} textAnchor="middle" fontSize={8} fill="#626B85">avance</text>
      </svg>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:'#EDF0F7', marginBottom:4 }}>✈ Viaje a Japón</div>
        <div style={{ fontSize:11, color:'#626B85', marginBottom:4, fontFamily:'var(--font-mono)' }}>$ 3,100 / $ 5,000</div>
        <div style={{ fontSize:11, color:'#FF8BB5', fontWeight:600 }}>faltan 142 días</div>
      </div>
    </div>
  );
}

function GastosFijosMock() {
  const items = [
    { icon:'🏠', name:'Renta', date:'04 dic', amount:'-$12,500' },
    { icon:'📺', name:'Netflix', date:'12 dic', amount:'-$15.99' },
    { icon:'📶', name:'Internet', date:'18 dic', amount:'-$599' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {items.map((g,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'#0A0D18', borderRadius:9, border:'1px solid #1A1F2E' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:14 }}>{g.icon}</span>
            <span style={{ fontSize:12.5, color:'#C8D0E4', fontWeight:500 }}>{g.name}</span>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:10, color:'#424A62', marginBottom:2 }}>{g.date}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#FF6B83', fontFamily:'var(--font-mono)' }}>{g.amount}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DivisasMock() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
      {[
        { pair:'USD/CRC', rate:'512.34', delta:'+0.42', up:true },
        { pair:'USD/MXN', rate:'17.18',  delta:'-0.09', up:false },
        { pair:'USD/COP', rate:'4,128',  delta:'-2.10', up:false },
        { pair:'USD/PEN', rate:'3.762',  delta:'+0.014', up:true },
        { pair:'EUR/USD', rate:'1.0842', delta:'+0.002', up:true },
        { pair:'USD/ARS', rate:'987.50', delta:'+1.30',  up:true },
      ].map(r=>(
        <div key={r.pair} style={{ padding:'10px 12px', background:'#0A0D18', border:'1px solid #1A1F2E', borderRadius:10 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#5B9BFF', letterSpacing:'0.04em', marginBottom:4 }}>{r.pair}</div>
          <div style={{ fontSize:13, fontWeight:800, color:'#EDF0F7', fontFamily:'var(--font-mono)', marginBottom:3 }}>{r.rate}</div>
          <div style={{ fontSize:10, fontWeight:600, color: r.up?'#4FE0A9':'#FF6B83' }}>{r.up?'▲':'▼'} {r.delta}</div>
        </div>
      ))}
    </div>
  );
}

function ReportesMock() {
  const months = ['E','F','M','A','M','J','J','A','S','O','N','D'];
  const inc =    [70, 80, 75, 85, 78, 90, 82, 88, 80, 92, 85, 95];
  const exp =    [55, 60, 58, 65, 52, 68, 60, 70, 58, 72, 62, 68];
  const maxV = 100;
  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:60, marginBottom:6 }}>
        {months.map((m,i)=>(
          <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <div style={{ width:'100%', display:'flex', gap:1, alignItems:'flex-end', height:52 }}>
              <div style={{ flex:1, background:'#4FE0A9', borderRadius:'2px 2px 0 0', height:`${(inc[i]/maxV)*52}px`, opacity:0.8 }} />
              <div style={{ flex:1, background:'#FF6B83', borderRadius:'2px 2px 0 0', height:`${(exp[i]/maxV)*52}px`, opacity:0.8 }} />
            </div>
            <span style={{ fontSize:8, color:'#424A62' }}>{m}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:'#4FE0A9' }} />
          <span style={{ fontSize:10, color:'#626B85' }}>Ingresos</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:'#FF6B83' }} />
          <span style={{ fontSize:10, color:'#626B85' }}>Gastos</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Security ───────────────────────────────────────────────────────── */
function Security() {
  const items = [
    { icon:'lock',    color:'#5B9BFF', title:'Row-Level Security', desc:'Tus datos solo son accesibles por vos. Ni el equipo de CoinDev puede leerlos. RLS de Supabase aplicado en cada tabla.' },
    { icon:'shield',  color:'#4FE0A9', title:'Cifrado en tránsito', desc:'Toda comunicación va por HTTPS/TLS. Nunca enviamos datos sensibles en texto plano.' },
    { icon:'bell',    color:'#9F7BFF', title:'Sesiones persistentes seguras', desc:'Tus sesiones se mantienen activas de forma segura. Si no usás la app por mucho tiempo, te pedirá autenticarte de nuevo.' },
    { icon:'zap',     color:'#F2C94C', title:'Sin acceso a tus cuentas bancarias', desc:'CoinDev es 100% manual — vos ingresás los datos. No pedimos credenciales bancarias ni acceso a tu banco.' },
  ];
  return (
    <section id="seguridad" style={{ padding:'100px 28px', background:'#0A0D18', borderTop:'1px solid #1A1F2E', borderBottom:'1px solid #1A1F2E' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:28, height:1, background:'#4FE0A9' }} />
          <span style={{ fontSize:11, fontWeight:700, color:'#4FE0A9', textTransform:'uppercase', letterSpacing:'0.12em' }}>SEGURIDAD</span>
        </div>
        <h2 style={{ fontSize:'clamp(26px,3vw,42px)', fontWeight:800, letterSpacing:'-0.04em', color:'#EDF0F7', marginBottom:12 }}>Tus datos son tuyos. Sin excepciones.</h2>
        <p style={{ fontSize:15, color:'#626B85', maxWidth:520, lineHeight:1.7, marginBottom:56 }}>CoinDev está construida con seguridad desde la base, no como parche.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }}>
          {items.map(s=>(
            <div key={s.title} style={{ background:'#0D1120', border:'1px solid #1A1F2E', borderRadius:16, padding:'24px' }}>
              <div style={{ width:40, height:40, borderRadius:10, background:s.color+'16', display:'grid', placeItems:'center', marginBottom:16 }}>
                <Ic n={s.icon} size={18} col={s.color} />
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:'#EDF0F7', marginBottom:8, letterSpacing:'-0.02em' }}>{s.title}</div>
              <div style={{ fontSize:13, color:'#626B85', lineHeight:1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ────────────────────────────────────────────────────────── */
function Pricing() {
  const features = [
    'Cuentas ilimitadas en 18 monedas LATAM',
    'Movimientos y categorías sin límite',
    'Presupuestos mensuales con alertas',
    'Metas de ahorro con conversión automática',
    'Gastos fijos y recurrentes',
    'Reportes de evolución 12 meses',
    'Tipos de cambio en tiempo real',
    'PWA — app nativa en iOS y Android',
    'Soporte en español e inglés',
    'Datos cifrados con RLS',
  ];
  return (
    <section id="pricing" style={{ padding:'100px 28px', background:'#06080E' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:28, height:1, background:'#5B9BFF' }} />
          <span style={{ fontSize:11, fontWeight:700, color:'#5B9BFF', textTransform:'uppercase', letterSpacing:'0.12em' }}>PRECIO</span>
        </div>
        <h2 style={{ fontSize:'clamp(26px,3vw,42px)', fontWeight:800, letterSpacing:'-0.04em', color:'#EDF0F7', marginBottom:12 }}>Un plan. Sin complicaciones.</h2>
        <p style={{ fontSize:15, color:'#626B85', maxWidth:460, lineHeight:1.7, marginBottom:56 }}>Todo incluido desde el primer día. Empezá gratis por 7 días sin tarjeta.</p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'start', maxWidth:900 }}>
          {/* Price card */}
          <div style={{ background:'#0D1120', border:'1px solid #1A1F2E', borderRadius:20, overflow:'hidden', position:'relative' }}>
            <div style={{ height:3, background:'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', position:'absolute', top:0, left:0, right:0 }} />
            <div style={{ padding:'36px 32px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#626B85', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:20 }}>Plan Pro</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, marginBottom:6 }}>
                <span style={{ fontSize:18, fontWeight:700, color:'#626B85', alignSelf:'flex-start', marginTop:10 }}>$</span>
                <span style={{ fontSize:72, fontWeight:800, letterSpacing:'-0.05em', color:'#EDF0F7', lineHeight:1 }}>4.99</span>
                <span style={{ fontSize:18, color:'#626B85', marginBottom:12 }}>/mes</span>
              </div>
              <div style={{ fontSize:13, color:'#424A62', marginBottom:28 }}>≈ ₡2,550 CRC · Cancelá cuando quieras</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'7px 16px', borderRadius:999, background:'rgba(79,224,169,0.1)', border:'1px solid rgba(79,224,169,0.25)', marginBottom:28 }}>
                <Ic n="zap" size={13} col="#4FE0A9" />
                <span style={{ fontSize:12.5, fontWeight:600, color:'#4FE0A9' }}>7 días gratis · Sin tarjeta requerida</span>
              </div>
              <a href={CHECKOUT_URL} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'15px', borderRadius:10, background:'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color:'#06080E', fontSize:14.5, fontWeight:700, textDecoration:'none', boxShadow:'0 8px 28px rgba(91,155,255,0.3)' }}>
                Empezar prueba gratuita <Ic n="arrow" size={15} col="#06080E" />
              </a>
              <p style={{ marginTop:12, fontSize:11.5, color:'#2E3650', textAlign:'center' }}>Pagos seguros con Lemon Squeezy</p>
            </div>
          </div>

          {/* Features list */}
          <div style={{ paddingTop:8 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#626B85', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:20 }}>Todo incluido</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {features.map(f=>(
                <div key={f} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(79,224,169,0.12)', display:'grid', placeItems:'center', flexShrink:0, marginTop:1 }}>
                    <Ic n="check" size={10} col="#4FE0A9" />
                  </div>
                  <span style={{ fontSize:14, color:'#9098AE', lineHeight:1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:700px){ .pricing-grid{ grid-template-columns:1fr!important; } }`}</style>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────── */
const FAQS = [
  { q:'¿Necesito tarjeta para la prueba?',          a:'No. Los 7 días son completamente gratis y sin datos de pago. Al finalizar, se te invitará a suscribirte.' },
  { q:'¿Puedo cancelar cuando quiera?',              a:'Sí, desde tu panel de Lemon Squeezy en cualquier momento. Sin penalizaciones ni períodos mínimos.' },
  { q:'¿Mis datos financieros están seguros?',       a:'Absolutamente. Usamos Supabase con Row-Level Security (RLS). Tus datos solo son accesibles por vos.' },
  { q:'¿Funciona como app en mi celular?',           a:'Sí. CoinDev es una PWA. Instalala desde el navegador en iOS o Android y funciona como app nativa.' },
  { q:'¿Qué monedas soporta?',                       a:'18 monedas: CRC, USD, MXN, GTQ, HNL, NIO, COP, PEN, BOB, CLP, ARS, UYU, PYG, DOP, SVC, BZD, VES y EUR.' },
  { q:'¿Pierdo datos si cancelo o pauso?',           a:'No. Tus datos se conservan siempre. Al reactivar, todo está exactamente como lo dejaste.' },
];

function FAQ() {
  const [open, setOpen] = useState<number|null>(null);
  return (
    <section id="faq" style={{ padding:'100px 28px', background:'#0A0D18', borderTop:'1px solid #1A1F2E' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:28, height:1, background:'#9F7BFF' }} />
          <span style={{ fontSize:11, fontWeight:700, color:'#9F7BFF', textTransform:'uppercase', letterSpacing:'0.12em' }}>FAQ</span>
        </div>
        <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:800, letterSpacing:'-0.04em', color:'#EDF0F7', marginBottom:40 }}>Preguntas frecuentes</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {FAQS.map((f,i)=>(
            <div key={i} style={{ border:`1px solid ${open===i?'#2A3448':'#1A1F2E'}`, borderRadius:14, overflow:'hidden', transition:'border-color 200ms' }}>
              <button onClick={()=>setOpen(open===i?null:i)} style={{ width:'100%', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:14.5, fontWeight:600, color:'#EDF0F7', lineHeight:1.35 }}>{f.q}</span>
                <span style={{ flexShrink:0, color:'#424A62', transform:open===i?'rotate(90deg)':'none', transition:'transform 200ms' }}>
                  <Ic n="arrow" size={16} />
                </span>
              </button>
              {open===i && <div style={{ padding:'0 20px 20px', fontSize:13.5, color:'#9098AE', lineHeight:1.7 }}>{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ──────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ padding:'80px 28px', background:'#06080E', textAlign:'center' }}>
      <div style={{ maxWidth:560, margin:'0 auto' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="CoinDev" width={60} height={60} style={{ borderRadius:16, marginBottom:24 }} />
        <h2 style={{ fontSize:'clamp(28px,4vw,46px)', fontWeight:800, letterSpacing:'-0.04em', color:'#EDF0F7', marginBottom:16, lineHeight:1.08 }}>
          Empezá hoy. Gratis.<br />
          <span style={{ background:'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Sin excusas.
          </span>
        </h2>
        <p style={{ fontSize:16, color:'#626B85', marginBottom:32, lineHeight:1.65 }}>7 días gratis, sin tarjeta. Cancelá cuando quieras. Tus datos, siempre tuyos.</p>
        <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:12 }}>
          <a href={CHECKOUT_URL} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 28px', borderRadius:10, background:'linear-gradient(135deg,#5BE5D1,#5B9BFF,#9F7BFF)', color:'#06080E', fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:'0 8px 28px rgba(91,155,255,0.28)' }}>
            Crear cuenta gratis <Ic n="arrow" size={16} col="#06080E" />
          </a>
          <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 24px', borderRadius:10, background:'#0D1120', color:'#9098AE', border:'1px solid #1A1F2E', fontSize:15, fontWeight:600, textDecoration:'none' }}>
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop:'1px solid #1A1F2E', padding:'40px 28px 28px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:32, marginBottom:36 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="CoinDev" width={22} height={22} style={{ borderRadius:6 }} />
              <span style={{ fontSize:15, fontWeight:800, color:'#EDF0F7', letterSpacing:'-0.03em' }}><span>Coin</span><span style={{ color:'#5B9BFF' }}>Dev</span></span>
            </div>
            <p style={{ fontSize:12.5, color:'#2E3650', maxWidth:240, lineHeight:1.65 }}>Finanzas personales diseñadas para LATAM. Tu dinero, bajo control total.</p>
          </div>
          <div style={{ display:'flex', gap:40, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:10.5, fontWeight:700, color:'#2E3650', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Producto</div>
              {[{h:'#modulos',l:'Módulos'},{h:'#seguridad',l:'Seguridad'},{h:'#pricing',l:'Precio'},{h:'#faq',l:'FAQ'}].map(x=>(
                <a key={x.h} href={x.h} style={{ display:'block', fontSize:13, color:'#424A62', textDecoration:'none', marginBottom:8 }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#9098AE')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#424A62')}>{x.l}</a>
              ))}
            </div>
            <div>
              <div style={{ fontSize:10.5, fontWeight:700, color:'#2E3650', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Cuenta</div>
              {[{h:'/login',l:'Iniciar sesión'},{h:'/register',l:'Registrarse'},{h:CHECKOUT_URL,l:'Prueba gratis'}].map(x=>(
                <a key={x.h} href={x.h} style={{ display:'block', fontSize:13, color:'#424A62', textDecoration:'none', marginBottom:8 }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#9098AE')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#424A62')}>{x.l}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop:'1px solid #1A1F2E', paddingTop:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <span style={{ fontSize:12, color:'#2E3650' }}>© {new Date().getFullYear()} CoinDev. Todos los derechos reservados.</span>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Ic n="lock" size={11} col="#2E3650" />
            <span style={{ fontSize:12, color:'#2E3650' }}>Pagos seguros con Lemon Squeezy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#06080E', color:'#EDF0F7', fontFamily:'var(--font-sans)' }}>
      <style>{`
        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .mod-top   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .mod-bot3  { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .mod-bot2  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; max-width: 900px; }
        @media(max-width:860px){
          .hero-grid  { grid-template-columns: 1fr !important; }
          .hero-right { display: none !important; }
          .mod-top    { grid-template-columns: 1fr !important; }
          .mod-bot3   { grid-template-columns: 1fr !important; }
          .mod-bot2   { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Ticker />
      <Navbar />
      <main>
        <Hero />
        <Modules />
        <Security />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
