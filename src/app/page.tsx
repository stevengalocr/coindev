'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

/* ─── LemonSqueezy checkout URL ────────────────────────────────────── */
const LS_URL =
  process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ??
  'https://galodevcr.lemonsqueezy.com/checkout/buy/8408ce19-3eda-4a63-93ea-bed0c90000e6?embed=1&logo=0&discount=0';

/* ─── SVG Icons ─────────────────────────────────────────────────────── */
const PATH: Record<string, string[]> = {
  arrow:    ['M5 12h14M12 5l7 7-7 7'],
  check:    ['M20 6 9 17l-5-5'],
  menu:     ['M4 6h16M4 12h16M4 18h16'],
  x:        ['M18 6 6 18M6 6l12 12'],
  lock:     ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z','M7 11V7a5 5 0 0 1 10 0v4'],
  shield:   ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  zap:      ['M13 2 3 14h9l-1 8 10-12h-9l1-8z'],
  swap:     ['M7 16V4m0 0L3 8m4-4 4 4','M17 8v12m0 0 4-4m-4 4-4-4'],
  wallet:   ['M21 12V7H5a2 2 0 0 1 0-4h14v4','M3 5v14a2 2 0 0 0 2 2h16v-5','M18 12a2 2 0 0 0 0 4h4v-4z'],
  chart:    ['M3 3v18h18','M18 9l-5 5-4-4-4 4'],
  target:   ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z'],
  repeat:   ['M17 1l4 4-4 4','M3 11V9a4 4 0 0 1 4-4h14','M7 23l-4-4 4-4','M21 13v2a4 4 0 0 1-4 4H3'],
  dollar:   ['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  barChart: ['M12 20V10','M18 20V4','M6 20v-4'],
  trending: ['M3 17l6-6 4 4 8-8','M14 7h6v6'],
  eye:      ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
  globe:    ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z','M2 12h20','M12 2a14 14 0 0 1 0 20M12 2a14 14 0 0 0 0 20'],
  star:     ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  users:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  sparkle:  ['M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z','M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z'],
};

function Ic({ n, size = 16, stroke = 1.8, col }: { n: string; size?: number; stroke?: number; col?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={col ?? 'currentColor'} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}>
      {(PATH[n] ?? PATH.arrow).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

/* ─── Scroll reveal hook ─────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── Global CSS ─────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    --bg:        #07070d;
    --bg-2:      #0c0c18;
    --panel:     #10101e;
    --panel-2:   #161628;
    --line:      rgba(255,255,255,0.07);
    --line-2:    rgba(255,255,255,0.12);
    --ink:       #ECEEF7;
    --ink-dim:   #9aa0bd;
    --ink-faint: #5f6485;
    --cyan:      #3FD2FF;
    --blue:      #4F7BFF;
    --violet:    #8B5CF6;
    --green:     #4ADE80;
    --red:       #FF6B6B;
    --amber:     #F59E0B;
    --grad:      linear-gradient(135deg, #3FD2FF 0%, #4F7BFF 45%, #8B5CF6 100%);
    --grad-r:    linear-gradient(135deg, #8B5CF6 0%, #4F7BFF 55%, #3FD2FF 100%);
    --grad-soft: linear-gradient(135deg, rgba(63,210,255,.18), rgba(139,92,246,.18));
  }

  html { scroll-behavior: smooth; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .land {
    background: var(--bg); color: var(--ink);
    font-family: 'Inter', system-ui, sans-serif;
    font-feature-settings: "ss01","cv11";
    -webkit-font-smoothing: antialiased; overflow-x: hidden; min-height: 100vh;
  }

  /* ── type ── */
  .disp { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.02em; }
  .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }

  /* ── bg ── */
  .orb { position: fixed; pointer-events: none; border-radius: 50%; filter: blur(120px); z-index: 0; }
  .orb-a { width:600px;height:600px;background:#3FD2FF;top:-200px;left:-180px;opacity:.16; }
  .orb-b { width:700px;height:700px;background:#8B5CF6;top:200px;right:-260px;opacity:.14; }
  .orb-c { width:400px;height:400px;background:#4F7BFF;bottom:-100px;left:40%;opacity:.10; }
  .bg-grid {
    position:fixed;inset:0;
    background-image:
      linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);
    background-size:56px 56px;
    mask-image:radial-gradient(ellipse 80% 60% at 50% 30%,#000 30%,transparent 75%);
    z-index:0;pointer-events:none;
  }

  /* ── scroll reveal ── */
  .reveal { opacity:0; transform:translateY(28px); transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1); }
  .reveal.in { opacity:1; transform:none; }
  .reveal-d1 { transition-delay:.08s; }
  .reveal-d2 { transition-delay:.16s; }
  .reveal-d3 { transition-delay:.24s; }
  .reveal-d4 { transition-delay:.32s; }
  @media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none;}}

  /* ── container ── */
  .c { max-width:1240px; margin:0 auto; padding:0 28px; }
  .c-narrow { max-width:780px; margin:0 auto; padding:0 28px; }

  /* ── nav ── */
  .land-nav {
    position:sticky;top:0;z-index:50;
    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    background:rgba(7,7,13,.72);
    border-bottom:1px solid var(--line);
    transition:background .3s;
  }
  .nav-row { display:flex;align-items:center;justify-content:space-between;height:68px; }
  .brand {
    display:flex;align-items:center;gap:10px;font-family:'Space Grotesk';
    font-weight:600;font-size:18px;letter-spacing:-0.01em;
    text-decoration:none;color:var(--ink);flex-shrink:0;
  }
  .brand img { width:30px;height:30px;border-radius:8px; }
  .brand-dim { color:var(--ink-dim);font-weight:500; }
  .nav-links { display:flex;gap:28px;font-size:14px; }
  .nav-links a { text-decoration:none;color:var(--ink-dim);transition:color .18s; }
  .nav-links a:hover { color:var(--ink); }
  @media(max-width:840px){ .nav-links{display:none;} }

  /* ── buttons ── */
  .btn {
    display:inline-flex;align-items:center;gap:8px;padding:10px 16px;
    border-radius:10px;font-size:14px;font-weight:500;
    border:1px solid var(--line-2);transition:all .18s;white-space:nowrap;
    text-decoration:none;color:var(--ink);cursor:pointer;background:none;font-family:inherit;
  }
  .btn:hover { border-color:rgba(255,255,255,.25);transform:translateY(-1px); }
  .btn-ghost { border-color:var(--line);color:var(--ink-dim); }
  .btn-ghost:hover { color:var(--ink); }
  .btn-primary {
    background:var(--grad);border:0;color:#fff;font-weight:600;
    box-shadow:0 8px 28px -8px rgba(79,123,255,.55),inset 0 1px 0 rgba(255,255,255,.22);
    position:relative;overflow:hidden;
  }
  .btn-primary::before {
    content:"";position:absolute;inset:0;background:rgba(255,255,255,.08);
    opacity:0;transition:opacity .2s;
  }
  .btn-primary:hover { transform:translateY(-2px);box-shadow:0 14px 36px -8px rgba(79,123,255,.7),inset 0 1px 0 rgba(255,255,255,.3); }
  .btn-primary:hover::before { opacity:1; }
  .btn-lg { padding:14px 26px;font-size:15.5px;border-radius:12px; }

  /* ── badge ── */
  .badge {
    display:inline-flex;align-items:center;gap:8px;padding:6px 12px;
    border-radius:999px;border:1px solid var(--line-2);background:rgba(255,255,255,.025);
    font-size:12.5px;color:var(--ink-dim);
  }
  .badge-dot { width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green); }

  /* ── hero ── */
  .hero-wrap { position:relative;padding:88px 0 64px;z-index:1; }
  .hero-grid {
    display:grid;grid-template-columns:1.05fr 1fr;gap:64px;
    align-items:center;margin-top:32px;
  }
  .hero-title {
    font-family:'Space Grotesk';font-weight:600;
    font-size:clamp(42px,5.6vw,76px);line-height:.97;
    letter-spacing:-0.038em;margin:20px 0 24px;
  }
  .hero-title .ln { display:block; }
  .codeflair {
    display:inline-flex;align-items:center;gap:6px;
    font-family:'JetBrains Mono';font-size:.6em;color:var(--cyan);
    border:1px solid rgba(63,210,255,.35);background:rgba(63,210,255,.07);
    padding:6px 14px;border-radius:10px;vertical-align:middle;
    margin-right:8px;font-weight:500;letter-spacing:0;
  }
  .hero-sub { font-size:17.5px;line-height:1.58;color:var(--ink-dim);max-width:520px; }
  .hero-ctas { display:flex;gap:12px;margin-top:32px;flex-wrap:wrap; }
  .hero-meta { display:flex;gap:26px;margin-top:36px;font-size:13px;color:var(--ink-faint);flex-wrap:wrap; }
  .hero-meta-it { display:flex;align-items:center;gap:7px; }

  /* ── dashboard preview ── */
  .preview { position:relative;perspective:1800px; }
  .preview-card {
    position:relative;border-radius:20px;
    background:linear-gradient(180deg,#13132a 0%,#0d0d1c 100%);
    border:1px solid var(--line-2);padding:18px;
    box-shadow:0 60px 120px -30px rgba(0,0,0,.75),0 0 0 1px rgba(63,210,255,.04);
    transform:rotateY(-6deg) rotateX(4deg);transform-origin:center;
    transition:transform .6s ease;
  }
  .preview:hover .preview-card { transform:rotateY(-2deg) rotateX(1deg); }
  .preview-card::before {
    content:"";position:absolute;inset:-1px;border-radius:21px;
    background:var(--grad);opacity:.14;z-index:-1;filter:blur(22px);
  }
  .pv-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:14px; }
  .pv-tabs { display:flex;gap:2px;background:rgba(255,255,255,.04);border-radius:8px;padding:3px; }
  .pv-tabs span { padding:5px 12px;border-radius:6px;font-size:11.5px;color:var(--ink-faint);cursor:default; }
  .pv-tabs span.on { background:rgba(255,255,255,.1);color:var(--ink); }
  .pv-dots { display:flex;gap:5px; }
  .pv-dots i { display:block;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.12); }
  .pv-balance { padding:16px 6px 4px;display:flex;align-items:baseline;gap:14px;flex-wrap:wrap; }
  .pv-lbl { font-size:10px;color:var(--ink-faint);letter-spacing:.09em;text-transform:uppercase;margin-bottom:5px; }
  .pv-amt { font-family:'Space Grotesk';font-weight:600;font-size:30px;letter-spacing:-0.02em; }
  .pv-delta { color:var(--green);font-size:11.5px;background:rgba(74,222,128,.12);padding:2px 8px;border-radius:6px;font-family:'JetBrains Mono';white-space:nowrap; }
  .pv-row { display:grid;grid-template-columns:1.1fr 1fr;gap:12px;margin-top:12px; }
  .pv-cell { background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:11px;padding:13px; }
  .pv-cell h4 { margin:0 0 7px;font-size:10px;color:var(--ink-faint);letter-spacing:.09em;text-transform:uppercase;font-weight:500; }
  .pv-cell .v { font-family:'JetBrains Mono';font-size:17px;font-weight:500; }
  .pv-cell.up .v { color:var(--green); }
  .pv-cell.dn .v { color:var(--red); }
  .pv-cats { margin-top:12px;background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:11px;padding:13px;display:flex;gap:14px;align-items:center; }
  .cats-list { flex:1;display:flex;flex-direction:column;gap:5px;font-size:12px; }
  .cat-row { display:flex;align-items:center;gap:8px;color:var(--ink-dim); }
  .cat-sw { width:8px;height:8px;border-radius:2px;flex-shrink:0; }
  .cat-pct { font-family:'JetBrains Mono';color:var(--ink);margin-left:auto; }
  .pv-accounts { margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:9px; }
  .pv-acct { background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:11px;padding:11px; }
  .pv-acct-row { display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--ink-faint);margin-bottom:5px; }
  .pv-acct-num { font-family:'JetBrains Mono';font-size:14px;font-weight:500; }
  .pill { font-size:9.5px;padding:2px 6px;border-radius:999px;background:rgba(63,210,255,.12);color:var(--cyan);border:1px solid rgba(63,210,255,.2); }
  .pill-v { background:rgba(139,92,246,.12);color:var(--violet);border-color:rgba(139,92,246,.2); }

  /* ── floating chips ── */
  .chip {
    position:absolute;background:rgba(14,14,32,.95);backdrop-filter:blur(10px);
    border:1px solid var(--line-2);border-radius:13px;padding:10px 14px;
    display:flex;align-items:center;gap:10px;font-size:12px;
    box-shadow:0 16px 40px -10px rgba(0,0,0,.7);z-index:2;
  }
  .chip-1 { top:-26px;left:-34px;transform:rotate(-3deg);animation:chipFloat1 5s ease-in-out infinite; }
  .chip-2 { bottom:24px;right:-36px;transform:rotate(2deg);animation:chipFloat2 6s ease-in-out infinite; }
  @keyframes chipFloat1 { 0%,100%{transform:rotate(-3deg) translateY(0)} 50%{transform:rotate(-3deg) translateY(-6px)} }
  @keyframes chipFloat2 { 0%,100%{transform:rotate(2deg) translateY(0)} 50%{transform:rotate(2deg) translateY(5px)} }
  .chip-ic { width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--grad-soft);color:var(--cyan);flex-shrink:0; }
  .chip-lb { color:var(--ink-faint);font-size:10px;text-transform:uppercase;letter-spacing:.08em;line-height:1.2; }
  .chip-vl { font-family:'JetBrains Mono';font-weight:500; }
  .chip-up { color:var(--green); }

  @media(max-width:980px){
    .hero-grid{grid-template-columns:1fr;gap:48px;}
    .preview-card{transform:none;}
    .chip-1{left:-6px;}
    .chip-2{right:-6px;}
  }
  @media(max-width:640px){
    .hero-title{font-size:clamp(34px,9.5vw,52px);}
    .hero-sub{font-size:16px;}
  }
  @media(max-width:540px){.chip-1,.chip-2{display:none;}}
  @media(max-width:480px){
    .c{padding:0 18px;}
    .c-narrow{padding:0 18px;}
    .pv-tabs span:not(.on){display:none;}
    .pv-head{justify-content:space-between;}
    .hero-ctas{flex-direction:column;align-items:flex-start;}
    .hero-ctas .btn{width:100%;justify-content:center;}
    .cur-badges{gap:5px;}
    .cur-badges .badge{font-size:11px;padding:4px 9px;}
  }

  /* ── ticker ── */
  .ticker-wrap {
    position:relative;z-index:1;
    border-top:1px solid var(--line);border-bottom:1px solid var(--line);
    background:rgba(12,12,24,.65);overflow:hidden;margin-top:64px;
  }
  .ticker-track {
    display:flex;gap:48px;padding:14px 0;white-space:nowrap;
    animation:tick 50s linear infinite;width:max-content;
  }
  .ticker-track:hover{animation-play-state:paused;}
  @keyframes tick{to{transform:translateX(-50%);}}
  .t-it{display:inline-flex;align-items:center;gap:10px;font-size:13px;color:var(--ink-dim);}
  .t-pair{color:var(--ink);font-weight:500;}
  .t-vl{font-family:'JetBrains Mono';}
  .t-up{color:var(--green);}
  .t-dn{color:var(--red);}
  .t-sep{width:5px;height:5px;border-radius:50%;background:var(--ink-faint);opacity:.2;}

  /* ── stats bar ── */
  .stats-bar {
    position:relative;z-index:1;
    display:grid;grid-template-columns:repeat(4,1fr);gap:0;
    border:1px solid var(--line);border-radius:20px;
    background:linear-gradient(180deg,rgba(16,16,30,.8),rgba(10,10,20,.8));
    overflow:hidden;margin-top:80px;
  }
  .stat-it { padding:28px 24px;text-align:center;position:relative; }
  .stat-it:not(:last-child)::after { content:"";position:absolute;right:0;top:25%;bottom:25%;width:1px;background:var(--line); }
  .stat-n { font-family:'Space Grotesk';font-weight:600;font-size:clamp(28px,3vw,38px);letter-spacing:-0.04em;color:var(--ink); }
  .stat-l { font-size:13px;color:var(--ink-dim);margin-top:4px; }
  @media(max-width:700px){.stats-bar{grid-template-columns:1fr 1fr;border-radius:16px;} .stat-it:nth-child(2)::after,.stat-it:nth-child(4)::after{display:none;} .stat-it:nth-child(1),.stat-it:nth-child(2){border-bottom:1px solid var(--line);}}
  @media(max-width:400px){.stats-bar{grid-template-columns:1fr;} .stat-it::after{display:none!important;} .stat-it{border-bottom:1px solid var(--line);} .stat-it:last-child{border-bottom:0;} .stat-n{font-size:30px;}}

  /* ── sections ── */
  .section { position:relative;z-index:1;padding:110px 0; }
  .eyebrow {
    display:inline-flex;align-items:center;gap:8px;
    font-family:'JetBrains Mono';font-size:11.5px;color:var(--cyan);
    text-transform:uppercase;letter-spacing:.14em;
  }
  .eyebrow::before{content:"";width:20px;height:1px;background:var(--cyan);}
  .sec-h { font-family:'Space Grotesk';font-weight:600;font-size:clamp(30px,3.8vw,50px);line-height:1.05;letter-spacing:-0.03em;margin:14px 0 20px;max-width:800px; }
  .sec-p { font-size:17px;color:var(--ink-dim);max-width:600px;line-height:1.62; }

  /* ── bento ── */
  .bento {
    display:grid;grid-template-columns:repeat(12,1fr);
    grid-auto-rows:minmax(190px,auto);gap:18px;margin-top:60px;
  }
  .tile {
    position:relative;
    background:linear-gradient(160deg,rgba(22,22,40,.8),rgba(10,10,22,.8));
    border:1px solid var(--line);border-radius:20px;padding:24px;
    overflow:hidden;transition:border-color .25s,transform .25s,box-shadow .25s;
    cursor:default;
  }
  .tile::before {
    content:"";position:absolute;inset:0;border-radius:20px;
    background:var(--grad-soft);opacity:0;transition:opacity .25s;
  }
  .tile:hover { border-color:rgba(63,210,255,.25);transform:translateY(-3px);box-shadow:0 24px 56px -16px rgba(0,0,0,.5); }
  .tile:hover::before { opacity:.5; }
  .t-tag { font-family:'JetBrains Mono';font-size:10px;color:var(--ink-faint);letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px;display:block; }
  .tile h3 { font-family:'Space Grotesk';font-weight:600;font-size:19px;letter-spacing:-0.02em;margin:8px 0 8px; }
  .tile p { font-size:13.5px;color:var(--ink-dim);line-height:1.52;margin:0; }
  .t-ico { width:38px;height:38px;border-radius:11px;background:var(--grad-soft);display:flex;align-items:center;justify-content:center;color:var(--cyan);border:1px solid rgba(63,210,255,.18); }
  .t-vis { margin-top:18px; }
  .t-mov{grid-column:span 6;} .t-cnt{grid-column:span 6;}
  .t-prs{grid-column:span 4;} .t-mts{grid-column:span 4;} .t-gfx{grid-column:span 4;}
  .t-div{grid-column:span 7;} .t-rep{grid-column:span 5;}
  @media(max-width:900px){.bento{grid-template-columns:repeat(2,1fr);}.t-mov,.t-cnt,.t-prs,.t-mts,.t-gfx,.t-div,.t-rep{grid-column:span 2;}}
  @media(max-width:540px){.bento{grid-template-columns:1fr;}.t-mov,.t-cnt,.t-prs,.t-mts,.t-gfx,.t-div,.t-rep{grid-column:span 1;}}

  /* ── tile children ── */
  .mov-list{display:flex;flex-direction:column;gap:7px;}
  .mov-it{display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid var(--line);transition:background .2s;}
  .mov-it:hover{background:rgba(255,255,255,.04);}
  .mov-g{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;}
  .mov-desc{font-size:12.5px;}
  .mov-d{font-size:10.5px;color:var(--ink-faint);margin-top:1px;}
  .mov-am{font-family:'JetBrains Mono';font-size:12.5px;font-weight:500;}
  .mov-in{color:var(--green);}.mov-out{color:#ffb4b4;}

  .pbar{height:5px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden;margin-top:5px;}
  .pbar>i{display:block;height:100%;width:var(--p);background:var(--grad);border-radius:4px;}
  .pbar-w>i{background:linear-gradient(90deg,#F59E0B,#FF6B6B);}
  .bgt-row{display:flex;justify-content:space-between;font-size:12px;margin-top:12px;}
  .bgt-nm{color:var(--ink-dim);}.bgt-vl{font-family:'JetBrains Mono';}

  .goal-ring{display:flex;align-items:center;gap:14px;margin-top:14px;}
  .goal-pct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk';font-weight:600;font-size:17px;}

  .fx-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;}
  .fx-it{padding:9px 11px;background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:9px;transition:background .2s;}
  .fx-it:hover{background:rgba(255,255,255,.04);}
  .fx-pair{font-family:'JetBrains Mono';font-size:10.5px;color:var(--ink-faint);}
  .fx-v{font-family:'JetBrains Mono';font-size:17px;font-weight:500;margin-top:2px;}
  .fx-ch{font-size:10.5px;margin-top:2px;}
  .fx-up{color:var(--green);}.fx-dn{color:var(--red);}

  .rec-list{display:flex;flex-direction:column;gap:7px;margin-top:10px;}
  .rec-it{display:flex;justify-content:space-between;align-items:center;padding:8px 11px;background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:9px;font-size:12.5px;transition:background .2s;}
  .rec-it:hover{background:rgba(255,255,255,.04);}
  .rec-nm{display:flex;align-items:center;gap:8px;}
  .rec-due{font-size:10.5px;color:var(--ink-faint);font-family:'JetBrains Mono';}
  .rec-am{font-family:'JetBrains Mono';color:#ffb4b4;}

  .bars-mini{display:flex;align-items:flex-end;gap:5px;height:76px;margin-top:14px;}
  .bars-mini i{flex:1;background:var(--grad);border-radius:2px 2px 0 0;opacity:.8;transition:opacity .2s;}
  .bars-mini:hover i{opacity:.5;}
  .bars-mini:hover i:last-child{opacity:1;}

  .acct-mini{display:flex;align-items:center;gap:11px;padding:11px 13px;border:1px solid var(--line);border-radius:11px;background:rgba(255,255,255,.02);margin-top:9px;transition:background .2s;}
  .acct-mini:hover{background:rgba(255,255,255,.035);}
  .acct-mini-bx{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#3FD2FF,#4F7BFF);display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk';font-weight:700;color:#0a0a18;font-size:13px;flex-shrink:0;}
  .acct-mini-bx-v{background:linear-gradient(135deg,#8B5CF6,#4F7BFF);}
  .acct-mini-body{flex:1;font-size:12.5px;}
  .acct-mini-nm{font-weight:500;}.acct-mini-sub{font-size:10.5px;color:var(--ink-faint);font-family:'JetBrains Mono';}
  .acct-mini-bal{font-family:'JetBrains Mono';font-size:13.5px;font-weight:500;}

  /* ── converter ── */
  .cr-wrap{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;margin-top:44px;}
  @media(max-width:860px){.cr-wrap{grid-template-columns:1fr;}}
  @media(max-width:480px){.conv-card{padding:22px 18px;} .conv-field input{font-size:22px;} .price-card{padding:28px 20px;}}
  .conv-card{
    background:linear-gradient(180deg,#13132a,#0b0b1c);
    border:1px solid var(--line-2);border-radius:24px;padding:30px;
    position:relative;overflow:hidden;
  }
  .conv-card::before{content:"";position:absolute;top:-80px;right:-80px;width:260px;height:260px;border-radius:50%;background:var(--grad);opacity:.14;filter:blur(64px);}
  .conv-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;position:relative;}
  .conv-title{font-family:'Space Grotesk';font-weight:600;font-size:18px;}
  .conv-live{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--ink-faint);font-family:'JetBrains Mono';}
  .conv-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:pulse 2s infinite;}
  @keyframes pulse{50%{opacity:.35;}}
  .conv-field{background:rgba(255,255,255,.028);border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;justify-content:space-between;align-items:center;}
  .conv-field input{background:transparent;border:0;outline:0;font-family:'Space Grotesk';font-weight:600;font-size:28px;color:var(--ink);width:60%;letter-spacing:-0.02em;}
  .conv-field input::placeholder{color:var(--ink-faint);}
  .conv-ccy{display:flex;align-items:center;gap:7px;font-family:'JetBrains Mono';font-weight:500;font-size:13.5px;color:var(--ink-dim);padding:7px 11px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:9px;}
  .conv-swap-row{display:flex;justify-content:center;margin:9px 0;}
  .conv-swap-btn{width:38px;height:38px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 22px -6px rgba(79,123,255,.55);color:#fff;border:0;cursor:pointer;transition:transform .2s;}
  .conv-swap-btn:hover{transform:rotate(180deg) scale(1.08);}
  .conv-rate{margin-top:16px;font-size:12px;color:var(--ink-faint);font-family:'JetBrains Mono';display:flex;justify-content:space-between;}
  .conv-rate b{color:var(--ink);font-weight:500;}
  .cur-badges{display:flex;flex-wrap:wrap;gap:7px;margin-top:22px;}

  /* ── steps ── */
  .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:52px;counter-reset:step;}
  .step{padding:28px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.018);position:relative;transition:border-color .25s,transform .25s;}
  .step:hover{border-color:var(--line-2);transform:translateY(-2px);}
  .step::before{counter-increment:step;content:"0" counter(step);position:absolute;top:18px;right:20px;font-family:'JetBrains Mono';font-size:11px;color:var(--ink-faint);letter-spacing:.1em;}
  .step h4{font-family:'Space Grotesk';font-weight:600;font-size:19px;margin:0 0 9px;letter-spacing:-0.01em;}
  .step p{font-size:13.5px;color:var(--ink-dim);margin:0;line-height:1.58;}
  .step-ln{height:1px;background:var(--grad);width:30px;margin-bottom:18px;opacity:.65;}
  @media(max-width:760px){.steps{grid-template-columns:1fr;}}

  /* ── security ── */
  .feat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:52px;}
  .fline{padding:24px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.018);transition:border-color .25s,transform .25s;}
  .fline:hover{border-color:rgba(63,210,255,.2);transform:translateY(-2px);}
  .fline-ic{width:34px;height:34px;border-radius:9px;background:var(--grad-soft);display:flex;align-items:center;justify-content:center;color:var(--cyan);margin-bottom:12px;}
  .fline h4{font-family:'Space Grotesk';font-weight:600;font-size:15.5px;margin:0 0 6px;}
  .fline p{margin:0;font-size:13px;color:var(--ink-dim);line-height:1.5;}
  @media(max-width:860px){.feat-grid{grid-template-columns:repeat(2,1fr);}}
  @media(max-width:480px){.feat-grid{grid-template-columns:1fr;}}

  /* ── testimonials ── */
  .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:52px;}
  .testi{padding:24px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(160deg,rgba(20,20,38,.7),rgba(12,12,24,.7));position:relative;}
  .testi-q{font-size:13.5px;color:var(--ink-dim);line-height:1.65;font-style:italic;}
  .testi-by{display:flex;align-items:center;gap:10px;margin-top:18px;}
  .testi-av{width:36px;height:36px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk';font-weight:700;font-size:13px;color:#fff;flex-shrink:0;}
  .testi-nm{font-size:13px;font-weight:600;color:var(--ink);}
  .testi-role{font-size:11.5px;color:var(--ink-faint);font-family:'JetBrains Mono';}
  .stars{display:flex;gap:2px;color:var(--amber);margin-bottom:12px;}
  @media(max-width:760px){.testi-grid{grid-template-columns:1fr;}}

  /* ── pricing ── */
  .price-wrap{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:start;max-width:880px;margin-top:52px;}
  @media(max-width:680px){.price-wrap{grid-template-columns:1fr;}}
  .price-card{
    background:linear-gradient(180deg,#13132a,#0b0b1c);
    border:1px solid var(--line-2);border-radius:24px;padding:36px 32px;
    position:relative;overflow:hidden;
  }
  .price-card::before{content:"";position:absolute;inset:0 0 auto;height:3px;background:var(--grad);}
  .price-card::after{content:"";position:absolute;top:-80px;right:-80px;width:280px;height:280px;border-radius:50%;background:var(--grad);opacity:.09;filter:blur(60px);pointer-events:none;}
  .price-tag{font-family:'Space Grotesk';font-weight:600;font-size:68px;letter-spacing:-0.05em;color:var(--ink);line-height:1;}
  .feat-list{display:flex;flex-direction:column;gap:10px;}
  .feat-item{display:flex;gap:10px;align-items:flex-start;}
  .feat-ck{width:18px;height:18px;border-radius:50%;background:rgba(74,222,128,.12);display:grid;place-items:center;flex-shrink:0;margin-top:2px;}

  /* ── FAQ ── */
  .faq-list{display:flex;flex-direction:column;gap:8px;margin-top:44px;}
  .faq-it{border:1px solid var(--line);border-radius:14px;overflow:hidden;transition:border-color .2s;}
  .faq-it.open{border-color:var(--line-2);}
  .faq-btn{width:100%;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:none;border:none;cursor:pointer;text-align:left;color:var(--ink);font-family:inherit;}
  .faq-q{font-size:14.5px;font-weight:600;line-height:1.35;font-family:'Space Grotesk';}
  .faq-a{padding:0 20px 20px;font-size:13.5px;color:var(--ink-dim);line-height:1.7;}

  /* ── final CTA ── */
  .cta-final{position:relative;z-index:1;text-align:center;padding:120px 0 100px;}
  .cta-final::before{content:"";position:absolute;left:50%;top:20%;transform:translateX(-50%);width:700px;height:700px;background:var(--grad);opacity:.09;filter:blur(130px);border-radius:50%;z-index:-1;pointer-events:none;}
  .cta-h2{font-family:'Space Grotesk';font-weight:600;font-size:clamp(38px,5vw,70px);letter-spacing:-0.038em;line-height:1;margin:0 auto 22px;max-width:15ch;}
  .cta-sub{color:var(--ink-dim);font-size:18px;max-width:500px;margin:0 auto 36px;line-height:1.6;}
  .url-bar{display:inline-flex;align-items:center;gap:10px;font-family:'JetBrains Mono';font-size:13px;color:var(--ink-dim);padding:8px 16px;border:1px solid var(--line);border-radius:999px;margin-top:32px;background:rgba(255,255,255,.025);}
  .url-bar-a{color:var(--cyan);}

  /* ── footer ── */
  .foot-wrap{border-top:1px solid var(--line);padding:64px 0 44px;position:relative;z-index:1;}
  .foot-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:40px;}
  .foot-col h5{font-family:'JetBrains Mono';font-size:10.5px;text-transform:uppercase;letter-spacing:.13em;color:var(--ink-faint);margin:0 0 14px;font-weight:500;}
  .foot-col a{display:block;font-size:13px;color:var(--ink-dim);margin-bottom:9px;text-decoration:none;transition:color .18s;}
  .foot-col a:hover{color:var(--ink);}
  .foot-desc{font-size:13px;color:var(--ink-dim);line-height:1.65;margin-top:14px;max-width:270px;}
  .foot-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:64px;padding-top:24px;border-top:1px solid var(--line);font-size:12px;color:var(--ink-faint);font-family:'JetBrains Mono';flex-wrap:wrap;gap:10px;}
  @media(max-width:760px){.foot-grid{grid-template-columns:1fr 1fr;}}
  @media(max-width:440px){.foot-grid{grid-template-columns:1fr;} .foot-bottom{flex-direction:column;align-items:center;text-align:center;}}

  /* ── mob nav ── */
  .mob-nav-panel{background:var(--bg-2);border-top:1px solid var(--line);padding:16px 28px 24px;}
  .mob-nav-link{display:block;padding:12px 0;font-size:15px;color:var(--ink-dim);text-decoration:none;border-bottom:1px solid var(--line);transition:color .18s;}
  .mob-nav-link:hover{color:var(--ink);}
`;

/* ─── Data ─────────────────────────────────────────────────────────── */
const RATES = [
  { pair:'USD/CRC', sym:'₡',  rate:'512.34', delta:'+0.42', up:true },
  { pair:'USD/MXN', sym:'$',  rate:'17.24',  delta:'-0.09', up:false },
  { pair:'USD/COP', sym:'$',  rate:'4,128',  delta:'-22',   up:false },
  { pair:'USD/ARS', sym:'$',  rate:'987.50', delta:'+4.20', up:true },
  { pair:'USD/CLP', sym:'$',  rate:'945.30', delta:'-2.10', up:false },
  { pair:'USD/PEN', sym:'S/', rate:'3.762',  delta:'+0.014',up:true },
  { pair:'USD/BRL', sym:'R$', rate:'5.082',  delta:'-0.022',up:false },
  { pair:'EUR/USD', sym:'',   rate:'1.0814', delta:'+0.002',up:true },
  { pair:'EUR/CRC', sym:'₡',  rate:'554.10', delta:'+0.28', up:true },
  { pair:'USD/GTQ', sym:'Q',  rate:'7.78',   delta:'+0.02', up:true },
];

/* ─── Sparkline ─────────────────────────────────────────────────────── */
function Spark({ color, pts }: { color: string; pts: number[] }) {
  const W = 200, H = 28;
  const mn = Math.min(...pts), mx = Math.max(...pts);
  const points = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * W;
    const y = H - ((v - mn) / (mx - mn || 1)) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      style={{ width:'100%', height:28, display:'block', marginTop:6 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Reveal wrapper ─────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`reveal${visible ? ' in' : ''}${className ? ' ' + className : ''}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}>
      {children}
    </div>
  );
}

/* ─── Nav ───────────────────────────────────────────────────────────── */
function Nav() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [mob, setMob] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { label:'Producto', href:'#producto' },
    { label:'Módulos',  href:'#modulos'  },
    { label:'Divisas',  href:'#divisas'  },
    { label:'Seguridad',href:'#seguridad'},
    { label:'Precio',   href:'#precio'   },
  ];

  return (
    <nav className="land-nav">
      <div className="c nav-row">
        <a className="brand" href="#">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="CoinDev" />
          <span>Coin<span className="brand-dim">Dev</span></span>
        </a>
        <div className="nav-links">
          {links.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {loggedIn ? (
            <Link href="/dashboard" className="btn btn-primary">
              Ir al app <Ic n="arrow" size={14} col="#fff" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost" id="nav-login">Iniciar sesión</Link>
              <style>{`@media(max-width:640px){#nav-login{display:none;}}`}</style>
              <a href={LS_URL} className="btn btn-primary lemonsqueezy-button">Crear cuenta →</a>
            </>
          )}
          <button className="btn btn-ghost" id="mob-btn"
            onClick={() => setMob(v => !v)}
            style={{ padding:'8px 10px' }} aria-label="menú">
            <Ic n={mob ? 'x' : 'menu'} size={19} />
          </button>
          <style>{`@media(min-width:841px){#mob-btn{display:none;}}`}</style>
        </div>
      </div>
      {mob && (
        <div className="mob-nav-panel">
          {links.map(l => <a key={l.href} href={l.href} className="mob-nav-link" onClick={() => setMob(false)}>{l.label}</a>)}
          <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:10 }}>
            <Link href="/login" className="btn btn-ghost" style={{ justifyContent:'center' }}>Iniciar sesión</Link>
            <a href={LS_URL} className="btn btn-primary lemonsqueezy-button" style={{ justifyContent:'center' }}>Crear cuenta gratis →</a>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Dashboard Preview ─────────────────────────────────────────────── */
function DashPreview() {
  return (
    <div className="preview" style={{ position:'relative' }}>
      <div className="chip chip-1">
        <div className="chip-ic"><Ic n="trending" size={14} col="var(--cyan)" /></div>
        <div>
          <div className="chip-lb">Ahorro este mes</div>
          <div className="chip-vl chip-up">+₡ 653,000</div>
        </div>
      </div>
      <div className="chip chip-2">
        <div className="chip-ic"><Ic n="dollar" size={14} col="var(--cyan)" /></div>
        <div>
          <div className="chip-lb">USD → CRC</div>
          <div className="chip-vl mono">₡ 512.34</div>
        </div>
      </div>

      <div className="preview-card">
        <div className="pv-head">
          <div className="pv-tabs">
            <span className="on">Inicio</span><span>Movimientos</span><span>Cuentas</span>
          </div>
          <div className="pv-dots"><i/><i/><i/></div>
        </div>

        <div className="pv-balance">
          <div>
            <div className="pv-lbl">Balance neto · Mayo 2026</div>
            <div className="pv-amt mono">
              ₡ 2,847,500<span style={{ color:'var(--ink-faint)', fontWeight:400 }}>.00</span>
            </div>
          </div>
          <div className="pv-delta">↑ 12.4%</div>
        </div>

        <div className="pv-row">
          <div className="pv-cell up">
            <h4>Ingresos</h4>
            <div className="v">+₡ 1,900,000</div>
            <Spark color="#4ADE80" pts={[22,18,20,14,16,10,12,8,11,6,9]} />
          </div>
          <div className="pv-cell dn">
            <h4>Gastos</h4>
            <div className="v">−₡ 1,247,000</div>
            <Spark color="#FF6B6B" pts={[14,18,12,20,14,22,16,24,18,12,15]} />
          </div>
        </div>

        <div className="pv-cats">
          <div style={{ width:90, height:90, flexShrink:0, position:'relative' }}>
            <svg viewBox="0 0 36 36" width={90} height={90}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a1a30" strokeWidth="3.5"/>
              {[
                { c:'#3FD2FF', da:'32 100', off:'0' },
                { c:'#4F7BFF', da:'24 100', off:'-32' },
                { c:'#8B5CF6', da:'18 100', off:'-56' },
                { c:'#FF6B6B', da:'14 100', off:'-74' },
              ].map(s => (
                <circle key={s.c} cx="18" cy="18" r="15.9" fill="none"
                  stroke={s.c} strokeWidth="3.5"
                  strokeDasharray={s.da} strokeDashoffset={s.off}
                  transform="rotate(-90 18 18)" />
              ))}
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span className="disp" style={{ fontSize:17, fontWeight:600 }}>6</span>
              <span style={{ fontSize:9, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.08em' }}>cat.</span>
            </div>
          </div>
          <div className="cats-list">
            {[['#3FD2FF','Vivienda','32%'],['#4F7BFF','Alimentación','24%'],['#8B5CF6','Transporte','18%'],['#FF6B6B','Ocio','14%']].map(([c,n,p]) => (
              <div key={n} className="cat-row">
                <span className="cat-sw" style={{ background:c }}/>
                <span>{n}</span>
                <span className="cat-pct">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pv-accounts">
          <div className="pv-acct">
            <div className="pv-acct-row"><span>BAC Colones</span><span className="pill">CRC</span></div>
            <div className="pv-acct-num">₡ 1,240,000</div>
          </div>
          <div className="pv-acct">
            <div className="pv-acct-row"><span>Visa BCR</span><span className="pill pill-v">USD</span></div>
            <div className="pv-acct-num">$ 1,200.00</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <header className="hero-wrap">
      <div className="c">
        <div style={{ opacity:1, animation:'heroFadeIn .8s ease both' }}>
          <style>{`@keyframes heroFadeIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>
          <span className="badge">
            <span className="badge-dot" />
            Finanzas personales para Latinoamérica
          </span>
        </div>

        <div className="hero-grid">
          <div style={{ animation:'heroFadeIn .9s .1s ease both' }}>
            <h1 className="hero-title disp">
              <span className="ln">Tus finanzas,</span>
              <span className="ln"><span className="codeflair">&lt;/&gt; multimoneda</span></span>
              <span className="ln" style={{ color:'var(--cyan)' }}>precisión absoluta.</span>
            </h1>
            <p className="hero-sub">
              La app de finanzas personales hecha para Latinoamérica. Registrá ingresos,
              controlá presupuestos, alcanzá metas y manejá múltiples monedas con tipos
              de cambio en vivo — todo en un solo lugar.
            </p>
            <div className="hero-ctas">
              <a href={LS_URL}
                className="btn btn-primary btn-lg lemonsqueezy-button"
                aria-label="Crear cuenta gratuita en CoinDev">
                Empezar gratis
                <Ic n="arrow" size={15} col="#fff" />
              </a>
              <a href="#producto" className="btn btn-ghost btn-lg">Ver el producto</a>
            </div>
            <div className="hero-meta">
              <div className="hero-meta-it"><Ic n="eye" size={13} col="var(--cyan)" />100% web · sin instalar</div>
              <div className="hero-meta-it"><Ic n="lock" size={13} col="var(--cyan)" />Cifrado RLS</div>
              <div className="hero-meta-it"><Ic n="zap" size={13} col="var(--cyan)" />Sin tarjeta</div>
            </div>
          </div>

          <div style={{ animation:'heroFadeIn 1s .2s ease both' }}>
            <DashPreview />
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Ticker ─────────────────────────────────────────────────────────── */
function Ticker() {
  const items = [...RATES, ...RATES];
  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {items.map((r, i) => (
          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
            <span className="t-it">
              <span className="t-pair">{r.pair}</span>
              <span className="t-vl">{r.sym} {r.rate}</span>
              <span className={r.up ? 't-up' : 't-dn'}>{r.up ? '▲' : '▼'} {r.delta}</span>
            </span>
            <span className="t-sep" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Stats bar ─────────────────────────────────────────────────────── */
function StatsBar() {
  const { ref, visible } = useReveal();
  const stats = [
    { n:'12+', l:'Módulos de finanzas' },
    { n:'28',  l:'Monedas LATAM' },
    { n:'100%', l:'Privacidad con RLS' },
    { n:'7',   l:'Días gratis, sin tarjeta' },
  ];
  return (
    <div className="c" style={{ position:'relative', zIndex:1 }}>
      <div ref={ref} className={`stats-bar reveal${visible ? ' in' : ''}`}>
        {stats.map((s, i) => (
          <div key={i} className="stat-it">
            <div className="stat-n disp" style={{ color:'var(--cyan)' }}>{s.n}</div>
            <div className="stat-l">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Bento Modules ─────────────────────────────────────────────────── */
function Modules() {
  return (
    <section className="section" id="modulos">
      <div className="c">
        <Reveal><span className="eyebrow">Ocho módulos · una sola app</span></Reveal>
        <Reveal delay={0.08}>
          <h2 className="sec-h">Todo lo que necesitás para entender, decidir y crecer financieramente.</h2>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="sec-p">Desde el primer movimiento hasta tu meta de un año. CoinDev une cuentas, presupuestos, metas y divisas en flujos diseñados para el día a día latinoamericano.</p>
        </Reveal>

        <div className="bento">
          {/* MOVIMIENTOS */}
          <div className="tile t-mov">
            <span className="t-tag">/dashboard/movimientos</span>
            <div className="t-ico"><Ic n="swap" size={18} col="var(--cyan)" /></div>
            <h3>Movimientos al detalle</h3>
            <p>Registrá ingresos y gastos en segundos. Filtros por tipo, búsqueda y agrupación automática "Hoy" / "Ayer".</p>
            <div className="t-vis mov-list">
              <div className="mov-it">
                <div className="mov-g" style={{ background:'rgba(74,222,128,.15)', color:'#7be8a9' }}><Ic n="trending" size={13} col="#7be8a9" /></div>
                <div className="mov-desc">Salario quincenal<div className="mov-d">Ingresos · Ayer</div></div>
                <div className="mov-am mov-in">+₡ 950,000</div>
              </div>
              <div className="mov-it">
                <div className="mov-g" style={{ background:'rgba(255,107,107,.15)', color:'#ffb4b4' }}><Ic n="wallet" size={13} col="#ffb4b4" /></div>
                <div className="mov-desc">Supermercado<div className="mov-d">Alimentación · Hoy</div></div>
                <div className="mov-am mov-out">−₡ 48,500</div>
              </div>
              <div className="mov-it">
                <div className="mov-g" style={{ background:'rgba(63,210,255,.15)', color:'var(--cyan)' }}><Ic n="zap" size={13} col="var(--cyan)" /></div>
                <div className="mov-desc">Gasolinera<div className="mov-d">Transporte · Ayer</div></div>
                <div className="mov-am mov-out">−₡ 22,300</div>
              </div>
            </div>
          </div>

          {/* CUENTAS */}
          <div className="tile t-cnt">
            <span className="t-tag">/dashboard/cuentas</span>
            <div className="t-ico"><Ic n="wallet" size={18} col="var(--cyan)" /></div>
            <h3>Cuentas, efectivo y tarjetas</h3>
            <p>Banco, ahorro, efectivo y crédito en su moneda nativa. Límite, uso y soft-delete — todo multimoneda.</p>
            <div className="t-vis">
              <div className="acct-mini">
                <div className="acct-mini-bx">B</div>
                <div className="acct-mini-body">
                  <div className="acct-mini-nm">BAC · Cuenta corriente</div>
                  <div className="acct-mini-sub">···· 4821 · Colones</div>
                </div>
                <div className="acct-mini-bal">₡ 1,240,000</div>
              </div>
              <div className="acct-mini">
                <div className="acct-mini-bx acct-mini-bx-v">V</div>
                <div className="acct-mini-body">
                  <div className="acct-mini-nm">Visa Platinum BCR</div>
                  <div className="acct-mini-sub">Crédito · 38% usado</div>
                </div>
                <div className="acct-mini-bal">$ 1,200</div>
              </div>
            </div>
          </div>

          {/* PRESUPUESTOS */}
          <div className="tile t-prs">
            <span className="t-tag">/presupuestos</span>
            <div className="t-ico"><Ic n="chart" size={18} col="var(--cyan)" /></div>
            <h3>Presupuestos con alerta</h3>
            <p>Límites por categoría. Alerta automática al 80% antes de que sea tarde.</p>
            <div className="t-vis">
              {[
                { nm:'Alimentación', pct:'78%', v:'₡ 168k / 216k', w:false },
                { nm:'Transporte',   pct:'97%', v:'₡ 104k / 108k', w:true  },
                { nm:'Ocio',         pct:'35%', v:'₡ 40k / 120k',  w:false },
              ].map(b => (
                <div key={b.nm}>
                  <div className="bgt-row"><span className="bgt-nm">{b.nm}</span><span className="bgt-vl mono">{b.v}</span></div>
                  <div className={`pbar${b.w ? ' pbar-w' : ''}`}><i style={{ '--p':b.pct } as React.CSSProperties} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* METAS */}
          <div className="tile t-mts">
            <span className="t-tag">/metas</span>
            <div className="t-ico"><Ic n="target" size={18} col="var(--cyan)" /></div>
            <h3>Metas con aportes reales</h3>
            <p>Cada abono descuenta de una cuenta y suma al progreso. Con historial completo.</p>
            <div className="t-vis goal-ring">
              <div style={{ width:78, height:78, flexShrink:0, position:'relative' }}>
                <svg viewBox="0 0 36 36" width={78} height={78}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a1a30" strokeWidth="3.2"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#gr1)" strokeWidth="3.2"
                    strokeDasharray="62 100" transform="rotate(-90 18 18)" strokeLinecap="round"/>
                  <defs><linearGradient id="gr1" x1="0" x2="1">
                    <stop offset="0" stopColor="#3FD2FF"/><stop offset="1" stopColor="#8B5CF6"/>
                  </linearGradient></defs>
                </svg>
                <div className="goal-pct">62%</div>
              </div>
              <div>
                <div style={{ fontSize:13.5, fontWeight:500, display:'flex', alignItems:'center', gap:6 }}><Ic n="target" size={13} col="var(--cyan)" /> Viaje a Europa</div>
                <div className="mono" style={{ fontSize:12, color:'var(--ink-faint)', marginTop:3 }}>₡ 1,860,000 / ₡ 3,000,000</div>
                <div className="mono" style={{ fontSize:11.5, color:'var(--cyan)', marginTop:3 }}>faltan 142 días</div>
              </div>
            </div>
          </div>

          {/* GASTOS FIJOS */}
          <div className="tile t-gfx">
            <span className="t-tag">/gastos-fijos</span>
            <div className="t-ico"><Ic n="repeat" size={18} col="var(--cyan)" /></div>
            <h3>Gastos fijos sin sorpresas</h3>
            <p>Alquiler, suscripciones, servicios. Próxima fecha y total comprometido.</p>
            <div className="t-vis rec-list">
              <div className="rec-it"><div className="rec-nm"><Ic n="shield" size={12} col="var(--ink-faint)" /> Alquiler</div><div className="rec-due">04 jun</div><div className="rec-am">−₡ 350k</div></div>
              <div className="rec-it"><div className="rec-nm"><Ic n="eye" size={12} col="var(--ink-faint)" /> Netflix</div><div className="rec-due">12 jun</div><div className="rec-am">−$ 15.99</div></div>
              <div className="rec-it"><div className="rec-nm"><Ic n="zap" size={12} col="var(--ink-faint)" /> Plan de datos</div><div className="rec-due">18 jun</div><div className="rec-am">−₡ 29,900</div></div>
            </div>
          </div>

          {/* DIVISAS */}
          <div className="tile t-div" id="divisas">
            <span className="t-tag">/divisas</span>
            <div className="t-ico"><Ic n="dollar" size={18} col="var(--cyan)" /></div>
            <h3>Tipos de cambio, en vivo</h3>
            <p>USD/CRC del BCCR sincronizado al minuto. Conversor interactivo, sparkline y pills de compra/venta.</p>
            <div className="t-vis fx-grid">
              {[
                { pair:'USD/CRC', v:'₡ 512.34', ch:'↑ +0.42', up:true },
                { pair:'EUR/CRC', v:'₡ 554.10', ch:'↑ +0.28', up:true },
                { pair:'USD/MXN', v:'$ 17.24',  ch:'↓ −0.09', up:false },
                { pair:'USD/COP', v:'$ 4,128',  ch:'↓ −22',   up:false },
              ].map(f => (
                <div key={f.pair} className="fx-it">
                  <div className="fx-pair">{f.pair}</div>
                  <div className="fx-v">{f.v}</div>
                  <div className={`fx-ch ${f.up ? 'fx-up' : 'fx-dn'}`}>{f.ch}</div>
                </div>
              ))}
            </div>
          </div>

          {/* REPORTES */}
          <div className="tile t-rep">
            <span className="t-tag">/reportes</span>
            <div className="t-ico"><Ic n="barChart" size={18} col="var(--cyan)" /></div>
            <h3>Reportes que sí entendés</h3>
            <p>Tasa de ahorro, top comercios, ratio de gastos fijos y días de fondo de emergencia.</p>
            <div className="t-vis bars-mini">
              {[32,48,40,64,56,78,70,92,84,100,88,95].map((h, i) => (
                <i key={i} style={{ height:`${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Converter Section ─────────────────────────────────────────────── */
function ConverterSection() {
  const RATE = 512.34;
  const [fromVal, setFromVal] = useState('1,000.00');
  const [toVal, setToVal]     = useState('512,340.00');
  const [inv, setInv]         = useState(false);

  const parse = (s: string) => parseFloat(s.replace(/[^\d.-]/g,'')) || 0;
  const fmt   = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });

  const compute = useCallback((v: string, inverted: boolean) => {
    const n = parse(v);
    return inverted ? fmt(n / RATE) : fmt(n * RATE);
  }, []);

  const handleFrom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromVal(e.target.value);
    setToVal(compute(e.target.value, inv));
  };

  const handleSwap = () => {
    const newInv = !inv;
    setInv(newInv);
    setFromVal(toVal);
    setToVal(compute(toVal, newInv));
  };

  return (
    <section className="section" id="producto" style={{ paddingTop:40 }}>
      <div className="c">
        <div className="cr-wrap">
          <div>
            <Reveal><span className="eyebrow">Diseñada para Latinoamérica</span></Reveal>
            <Reveal delay={0.08}><h2 className="sec-h">Tu moneda local y el dólar — en la misma app.</h2></Reveal>
            <Reveal delay={0.14}><p className="sec-p">Cobrás en tu moneda local, pagás suscripciones en dólares, viajás por la región. CoinDev convierte, registra y suma todo automáticamente con tipos de cambio en tiempo real.</p></Reveal>
            <Reveal delay={0.2}>
              <div className="hero-ctas" style={{ marginTop:28 }}>
                <a href={LS_URL} className="btn btn-primary lemonsqueezy-button">Probalo gratis</a>
                <Link href="/login" className="btn btn-ghost">Iniciar sesión</Link>
              </div>
              <div className="hero-meta" style={{ marginTop:24 }}>
                <div className="hero-meta-it"><Ic n="check" size={13} col="var(--cyan)" />Tipos de cambio en tiempo real</div>
                <div className="hero-meta-it"><Ic n="check" size={13} col="var(--cyan)" />28 monedas LATAM</div>
              </div>
              <div className="cur-badges">
                {['CRC','USD','MXN','COP','BRL','CLP','PEN','ARS','GTQ','+ 19 más'].map(c => (
                  <span key={c} className="badge" style={{ fontSize:12 }}>{c}</span>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="conv-card">
              <div className="conv-h">
                <div className="conv-title">Conversor en vivo</div>
                <div className="conv-live"><span className="conv-dot"/>Currency API · LIVE</div>
              </div>
              <div className="conv-field">
                <input value={fromVal} onChange={handleFrom} type="text" inputMode="decimal" placeholder="0.00" />
                <div className="conv-ccy">{inv ? 'CRC' : 'USD'} ▾</div>
              </div>
              <div className="conv-swap-row">
                <button className="conv-swap-btn" onClick={handleSwap} aria-label="invertir">
                  <Ic n="swap" size={14} col="#fff" />
                </button>
              </div>
              <div className="conv-field">
                <input value={toVal} type="text" inputMode="decimal" readOnly style={{ color:'var(--ink-dim)' }} />
                <div className="conv-ccy">{inv ? 'USD' : 'CRC'} ▾</div>
              </div>
              <div className="conv-rate">
                <span>1 USD = <b>₡ {RATE.toFixed(2)} CRC</b></span>
                <span>Margen: <b>0.0%</b></span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ──────────────────────────────────────────────────── */
function HowItWorks() {
  return (
    <section className="section">
      <div className="c">
        <Reveal><span className="eyebrow">En tres pasos</span></Reveal>
        <Reveal delay={0.08}><h2 className="sec-h">De cero al control total en menos de cinco minutos.</h2></Reveal>
        <div className="steps">
          {[
            { title:'Creá tus cuentas', body:'Bancarias, efectivo y tarjetas en segundos. Definí moneda (CRC, USD u otra) y saldo inicial — listo.' },
            { title:'Registrá movimientos', body:'Cada gasto o ingreso entra con categoría, cuenta y moneda. Marcá los recurrentes y ya nunca se te escapan.' },
            { title:'Decidí con datos', body:'Reportes, presupuestos y metas trabajan juntos para que sepás exactamente dónde estás y a dónde vas.' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="step">
                <div className="step-ln" />
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Security ──────────────────────────────────────────────────────── */
function Security() {
  const items = [
    { icon:'lock',    title:'RLS por fila',          body:'Row Level Security en cada tabla. Cada consulta valida tu identidad — imposible ver datos ajenos, ni siquiera para nosotros.' },
    { icon:'shield',  title:'Cifrado TLS 1.3',        body:'Todo el tráfico viaja cifrado punto a punto. Sin excepciones, sin texto plano.' },
    { icon:'barChart',title:'Exportá cuando quieras', body:'Tus datos son tuyos. CSV, JSON o backup completo en un clic. Sin lock-in.' },
    { icon:'eye',     title:'Sin tracking',           body:'Cero pixeles publicitarios, cero venta de perfiles. Solo vos y tu información. Promesa.' },
  ];
  return (
    <section className="section" id="seguridad" style={{ paddingTop:40 }}>
      <div className="c">
        <Reveal><span className="eyebrow">Privacidad por diseño</span></Reveal>
        <Reveal delay={0.08}><h2 className="sec-h">Tus datos financieros nunca salen de tu fila.</h2></Reveal>
        <Reveal delay={0.14}><p className="sec-p">Construido sobre PostgreSQL con RLS: nadie — ni siquiera nosotros — puede leer datos que no son tuyos. Sin compartir con anunciantes, sin vender perfiles.</p></Reveal>
        <div className="feat-grid">
          {items.map((f, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="fline">
                <div className="fline-ic"><Ic n={f.icon} size={16} col="var(--cyan)" /></div>
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ──────────────────────────────────────────────────── */
function Testimonials() {
  const items = [
    { q:'"Por fin una app que entiende que manejo dos monedas al mismo tiempo. El conversor con el tipo de cambio en tiempo real es exactamente lo que necesitaba."', nm:'Carlos M.', role:'Freelancer · Ciudad de México', av:'CM' },
    { q:'"Los presupuestos con alerta al 80% me salvaron de pasarme en transporte dos veces seguidas. Ahora sé exactamente cuándo frenar."', nm:'Valeria R.', role:'Diseñadora · Bogotá', av:'VR' },
    { q:'"Tenía miedo de que mis datos financieros estuvieran inseguros. Saber que RLS los protege me da total tranquilidad."', nm:'Diego A.', role:'Ingeniero · Lima', av:'DA' },
  ];
  return (
    <section className="section" style={{ paddingTop:20 }}>
      <div className="c">
        <Reveal><span className="eyebrow">Lo que dicen los usuarios</span></Reveal>
        <Reveal delay={0.08}><h2 className="sec-h" style={{ maxWidth:540 }}>Finanzas bajo control. Desde Latinoamérica.</h2></Reveal>
        <div className="testi-grid">
          {items.map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="testi">
                <div className="stars">{[1,2,3,4,5].map(s => <Ic key={s} n="star" size={13} col="var(--amber)" />)}</div>
                <p className="testi-q">{t.q}</p>
                <div className="testi-by">
                  <div className="testi-av">{t.av}</div>
                  <div>
                    <div className="testi-nm">{t.nm}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ───────────────────────────────────────────────────────── */
function Pricing() {
  const features = [
    'Cuentas ilimitadas — CRC, USD y 28 monedas LATAM',
    'Movimientos y categorías sin límite',
    'Presupuestos con alertas al 80% del límite',
    'Metas de ahorro con historial de aportes',
    'Gastos fijos y recurrentes automatizados',
    'Reportes de evolución anual (12 meses)',
    'Tipos de cambio en tiempo real · Currency API',
    'Acceso desde cualquier dispositivo sin instalar',
    'Soporte en español · Respuesta rápida',
    'Datos cifrados con RLS · Sin publicidad',
  ];
  return (
    <section className="section" id="precio" style={{ paddingTop:40 }}>
      <div className="c">
        <Reveal><span className="eyebrow">Precio</span></Reveal>
        <Reveal delay={0.08}><h2 className="sec-h">Un plan. Sin complicaciones.</h2></Reveal>
        <Reveal delay={0.14}><p className="sec-p">Todo incluido desde el primer día. Empezá gratis, sin tarjeta requerida.</p></Reveal>

        <div className="price-wrap">
          <Reveal delay={0.1}>
            <div className="price-card">
              <div style={{ fontSize:12, fontWeight:700, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:20 }}>Plan Pro</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, marginBottom:6 }}>
                <span style={{ fontSize:18, fontWeight:700, color:'var(--ink-faint)', alignSelf:'flex-start', marginTop:10 }}>$</span>
                <span className="price-tag disp">4.99</span>
                <span style={{ fontSize:17, color:'var(--ink-faint)', marginBottom:14 }}>/mes</span>
              </div>
              <div className="mono" style={{ fontSize:13, color:'var(--ink-faint)', marginBottom:28 }}>Facturado en USD · Cancelá cuando quieras</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'7px 16px', borderRadius:999, background:'rgba(74,222,128,.1)', border:'1px solid rgba(74,222,128,.25)', marginBottom:28 }}>
                <Ic n="zap" size={13} col="var(--green)" />
                <span style={{ fontSize:12.5, fontWeight:600, color:'var(--green)' }}>7 días gratis · Sin tarjeta requerida</span>
              </div>
              <a href={LS_URL}
                className="btn btn-primary lemonsqueezy-button"
                style={{ width:'100%', justifyContent:'center', padding:'15px', fontSize:14.5, borderRadius:12 }}>
                Empezar prueba gratuita <Ic n="arrow" size={15} col="#fff" />
              </a>
              <p className="mono" style={{ marginTop:14, fontSize:11.5, color:'var(--ink-faint)', textAlign:'center' }}>
                Pagos seguros con Lemon Squeezy
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div style={{ paddingTop:8 }}>
              <div className="mono" style={{ fontSize:11.5, fontWeight:700, color:'var(--ink-faint)', textTransform:'uppercase', letterSpacing:'.09em', marginBottom:20 }}>Todo incluido</div>
              <div className="feat-list">
                {features.map(f => (
                  <div key={f} className="feat-item">
                    <div className="feat-ck"><Ic n="check" size={10} col="var(--green)" /></div>
                    <span style={{ fontSize:14, color:'var(--ink-dim)', lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ───────────────────────────────────────────────────────────── */
const FAQS = [
  { q:'¿Necesito tarjeta para la prueba?',          a:'No. Los primeros 7 días son completamente gratis y sin datos de pago. Al finalizar, se te invitará a suscribirte.' },
  { q:'¿Puedo cancelar cuando quiera?',              a:'Sí, en cualquier momento desde tu panel de Lemon Squeezy. Sin penalizaciones ni períodos mínimos.' },
  { q:'¿Mis datos financieros están seguros?',       a:'Absolutamente. Usamos Supabase con Row-Level Security (RLS). Tus datos son solo accesibles por vos — ni el equipo de CoinDev puede leerlos.' },
  { q:'¿Soporta varias monedas al mismo tiempo?',    a:'Sí. Tenés cuentas en CRC, USD y otras monedas simultáneamente. El tipo de cambio se aplica automáticamente con datos en tiempo real para una vista consolidada.' },
  { q:'¿Qué pasa si cancelo o pauso?',               a:'Tus datos se conservan siempre. Al reactivar, todo está exactamente como lo dejaste.' },
  { q:'¿Funciona como app en mi celular?',           a:'Sí. CoinDev es una PWA. Instalala desde el navegador en iOS o Android y funciona como app nativa sin ir al App Store.' },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="section" style={{ paddingTop:20 }}>
      <div className="c-narrow">
        <Reveal><span className="eyebrow">FAQ</span></Reveal>
        <Reveal delay={0.08}><h2 className="sec-h">Preguntas frecuentes</h2></Reveal>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className={`faq-it${open === i ? ' open' : ''}`}>
              <button className="faq-btn" onClick={() => setOpen(open === i ? null : i)}>
                <span className="faq-q">{f.q}</span>
                <span style={{ flexShrink:0, color:'var(--ink-faint)', transform:open === i ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}>
                  <Ic n="arrow" size={16} />
                </span>
              </button>
              {open === i && <div className="faq-a">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="cta-final">
      <div className="c">
        <Reveal>
          <h2 className="cta-h2 disp">
            Tomá el control.{' '}
            <span style={{ color:'var(--cyan)' }}>Hoy.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="cta-sub">Creá tu cuenta gratis. Sin tarjeta, sin compromisos. En menos de un minuto.</p>
        </Reveal>
        <Reveal delay={0.18}>
          <div style={{ display:'inline-flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
            <a href={LS_URL} className="btn btn-primary btn-lg lemonsqueezy-button">
              Crear cuenta gratis →
            </a>
            <Link href="/login" className="btn btn-ghost btn-lg">Iniciar sesión</Link>
          </div>
          <div>
            <div className="url-bar" style={{ marginTop:32 }}>
              <Ic n="globe" size={13} col="var(--ink-faint)" />
              <span><span className="url-bar-a">https://</span>coindev.app</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="foot-wrap">
      <div className="c">
        <div className="foot-grid">
          <div className="foot-col">
            <a className="brand" href="#" style={{ marginBottom:6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="CoinDev" />
              <span>Coin<span className="brand-dim">Dev</span></span>
            </a>
            <p className="foot-desc">Finanzas personales construidas para Latinoamérica, con la precisión de quien las arma desde cero.</p>
          </div>
          <div className="foot-col">
            <h5>Producto</h5>
            <a href="#modulos">Módulos</a>
            <a href="#divisas">Divisas</a>
            <a href="#seguridad">Seguridad</a>
            <a href="#precio">Precio</a>
          </div>
          <div className="foot-col">
            <h5>Cuenta</h5>
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Registrarse</Link>
            <a href={LS_URL} className="lemonsqueezy-button">Prueba gratis</a>
          </div>
          <div className="foot-col">
            <h5>Legal</h5>
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
            <a href="#">Contacto</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} CoinDev · Hecho en Latinoamérica</span>
          <span className="mono">coindev.app</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page Root ─────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="land">
      <style>{CSS}</style>
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <div className="bg-grid" />

      <Nav />
      <main style={{ position:'relative', zIndex:1 }}>
        <Hero />
        <Ticker />
        <StatsBar />
        <Modules />
        <ConverterSection />
        <HowItWorks />
        <Security />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
