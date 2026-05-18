'use client';

import { useMemo } from 'react';
import type { Currency } from '@/lib/data';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function Sparkline({ data, color = 'var(--cyan)', height = 40, width = 120 }: SparklineProps) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fillPath = `${path} L${width},${height} L0,${height} Z`;
  const id = useMemo(() => `sp-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface DonutSegment { value: number; color: string; cat: string }
interface DonutProps {
  data: DonutSegment[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function Donut({ data, size = 160, stroke = 22, centerLabel, centerValue }: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        {data.map((d, i) => {
          const dash = (d.value / total) * C;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={d.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash + 1.5;
          return el;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {centerLabel && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {centerLabel}
          </div>
        )}
        {centerValue && (
          <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
            {centerValue}
          </div>
        )}
      </div>
    </div>
  );
}

interface YearDataPoint { m: string; income: number; expense: number; future: boolean }
interface YearChartProps {
  data: YearDataPoint[];
  currency: Currency;
  big?: boolean;
}

export function YearChart({ data, big = false }: YearChartProps) {
  const w = big ? 700 : 320;
  const h = big ? 230 : 130;
  const padL = 8, padR = 8, padT = 16, padB = big ? 26 : 22;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const max = Math.max(...data.map(d => Math.max(d.income, d.expense)));
  const xFor = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const yFor = (v: number) => padT + innerH - (v / max) * innerH;
  const present = data.map((d, i) => ({ d, i })).filter(({ d }) => d.income > 0);
  const incomePath = present.map(({ d, i }, k) => `${k === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d.income)}`).join(' ');
  const expensePath = present.map(({ d, i }, k) => `${k === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d.expense)}`).join(' ');
  const last = present[present.length - 1];
  const currentIdx = 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', marginTop: 8 }}>
      <defs>
        <linearGradient id="bg-inc" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4FE0A9" stopOpacity="0.3" />
          <stop offset="1" stopColor="#4FE0A9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={padL} x2={padL + innerW} y1={padT + innerH * p} y2={padT + innerH * p} stroke="var(--border)" strokeDasharray="2 4" />
      ))}
      {present.length > 0 && (
        <>
          <path d={`${incomePath} L ${xFor(last.i)} ${padT + innerH} L ${xFor(0)} ${padT + innerH} Z`} fill="url(#bg-inc)" />
          <path d={incomePath} stroke="var(--income)" strokeWidth={big ? 2.2 : 2} fill="none" strokeLinecap="round" />
          <path d={expensePath} stroke="var(--expense)" strokeWidth={big ? 2.2 : 2} fill="none" strokeLinecap="round" />
          <circle cx={xFor(last.i)} cy={yFor(last.d.income)} r={big ? 4 : 3.5} fill="var(--income)" stroke="var(--surface)" strokeWidth="2" />
          <circle cx={xFor(last.i)} cy={yFor(last.d.expense)} r={big ? 4 : 3.5} fill="var(--expense)" stroke="var(--surface)" strokeWidth="2" />
        </>
      )}
      {data.map((d, i) => (
        <text key={i} x={xFor(i)} y={h - (big ? 6 : 4)} textAnchor="middle" fontSize={big ? 10 : 9}
          fill={i === currentIdx ? 'var(--text)' : 'var(--text-3)'}
          fontWeight={i === currentIdx ? 600 : 400}>
          {d.m}
        </text>
      ))}
    </svg>
  );
}

export function HeroSwoosh({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity }}>
      <defs>
        <linearGradient id="hero-grad" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0" stopColor="#5BE5D1" />
          <stop offset="0.5" stopColor="#5B9BFF" />
          <stop offset="1" stopColor="#9F7BFF" />
        </linearGradient>
        <linearGradient id="hero-grad-2" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#5BE5D1" stopOpacity="0.0" />
          <stop offset="1" stopColor="#9F7BFF" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d="M0 150 Q 100 100 200 130 T 400 110 L 400 200 L 0 200 Z" fill="url(#hero-grad)" opacity="0.18" />
      <path d="M0 170 Q 120 130 220 155 T 400 140 L 400 200 L 0 200 Z" fill="url(#hero-grad-2)" opacity="0.4" />
    </svg>
  );
}
