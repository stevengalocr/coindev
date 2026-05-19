'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { FX_RATES, FX_HISTORY, type FxRate } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';
import { Sparkline } from '@/components/shell/Charts';

interface ApiFxRate extends FxRate { live?: boolean }

function CurrencyBadge({ cc, size = 36 }: { cc: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: 'var(--surface-3)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
      letterSpacing: '0.03em', fontFamily: 'var(--font-mono)', flexShrink: 0,
    }}>
      {cc}
    </div>
  );
}

function Skeleton({ w, h, radius = 6 }: { w: number | string; h: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'var(--surface-3)',
      animation: 'cd-pulse 1.5s ease-in-out infinite',
    }} />
  );
}

export default function DivisasPage() {
  const { t, lang } = useApp();
  const [fromCRC, setFromCRC] = useState(true);
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState<ApiFxRate[]>(FX_RATES);
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/fx')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (!data?.rates?.length) throw new Error('empty');
        setRates(data.rates as ApiFxRate[]);
        setDate(data.date);
        setLive(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const usd = rates[0] ?? FX_RATES[0];
  const parsed = parseFloat(amount) || 0;
  const converted = parsed > 0
    ? fromCRC
      ? (parsed / usd.crc).toFixed(2)
      : Math.round(parsed * usd.crc).toLocaleString('es-CR')
    : '';

  const historyValues = FX_HISTORY.map(h => h.rate);

  const updatedLabel = (() => {
    const d = date ? new Date(date + 'T12:00:00') : new Date();
    return d.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  })();

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 20 }}>

      <style>{`@keyframes cd-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            {t.divisas}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: live ? 'var(--income)' : error ? 'var(--expense)' : 'var(--text-3)',
              display: 'inline-block', flexShrink: 0,
              boxShadow: live ? '0 0 6px var(--income)' : 'none',
            }} />
            {live
              ? (lang === 'es' ? 'Datos en tiempo real · Currency API' : 'Live data · Currency API')
              : loading
                ? (lang === 'es' ? 'Cargando…' : 'Loading…')
                : (lang === 'es' ? 'Datos referenciales (sin conexión)' : 'Reference data (offline)')}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'right' }}>
          <div>{lang === 'es' ? 'Actualizado' : 'Updated'}</div>
          {loading
            ? <Skeleton w={110} h={16} />
            : <div style={{ color: 'var(--text-2)', fontWeight: 500 }}>{updatedLabel}</div>}
        </div>
      </div>

      {/* Hero USD/CRC */}
      <div className="cd-card" style={{ padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 100% 0%, color-mix(in oklab, var(--blue) 12%, transparent), transparent 55%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <CurrencyBadge cc="US" size={40} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {lang === 'es' ? 'Dólar Americano' : 'US Dollar'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>USD / CRC</div>
              </div>
              {!loading && (
                <span style={{
                  marginLeft: 'auto',
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '3px 9px', borderRadius: 999,
                  background: usd.up ? 'var(--income-soft)' : 'var(--expense-soft)',
                  color: usd.up ? 'var(--income)' : 'var(--expense)',
                  fontSize: 11, fontWeight: 600,
                }}>
                  <Icon name={usd.up ? 'arrow-up' : 'arrow-down'} size={9} stroke={2.5} />
                  {usd.up ? '+' : ''}{usd.change}%
                </span>
              )}
            </div>

            {loading ? (
              <Skeleton w={140} h={44} />
            ) : (
              <div className="mono" style={{ fontSize: 44, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                ₡{usd.crc.toLocaleString()}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              {lang === 'es' ? 'por 1 dólar americano' : 'per 1 US dollar'}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              {loading ? (
                <><Skeleton w={90} h={52} /><Skeleton w={90} h={52} /></>
              ) : (
                <>
                  <RatePill label={lang === 'es' ? 'Compra' : 'Buy'} value={`₡${usd.buy.toLocaleString()}`} color="var(--income)" />
                  <RatePill label={lang === 'es' ? 'Venta' : 'Sell'} value={`₡${usd.sell.toLocaleString()}`} color="var(--expense)" />
                </>
              )}
            </div>
          </div>

          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {lang === 'es' ? 'Últimos 12 meses (ref.)' : 'Last 12 months (ref.)'}
            </div>
            <Sparkline data={historyValues} color="var(--blue)" height={64} width={200} />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: 200, fontSize: 10, color: 'var(--text-4)' }}>
              <span>Jun &apos;25</span>
              <span>May &apos;26</span>
            </div>
          </div>
        </div>
      </div>

      {/* Converter */}
      <div className="cd-card" style={{ padding: '20px 22px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 16 }}>
          {t.converter}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ConverterField
            symbol={fromCRC ? '₡' : '$'}
            code={fromCRC ? 'CRC' : 'USD'}
            value={amount}
            onChange={setAmount}
            placeholder="0"
          />
          <button
            onClick={() => { setFromCRC(v => !v); setAmount(''); }}
            style={{
              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'grid', placeItems: 'center', color: 'var(--text-2)',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          >
            <Icon name="swap" size={16} stroke={2} />
          </button>
          <ConverterField
            symbol={fromCRC ? '$' : '₡'}
            code={fromCRC ? 'USD' : 'CRC'}
            value={converted}
            readOnly
            placeholder="0.00"
          />
        </div>
        <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--text-3)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {loading ? (
            <Skeleton w={200} h={14} />
          ) : (
            <>
              <span className="mono">1 USD = ₡{usd.crc.toLocaleString()}</span>
              <span className="mono">1 CRC = ${(1 / usd.crc).toFixed(6)}</span>
            </>
          )}
        </div>
      </div>

      {/* Rate table */}
      <div className="cd-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {lang === 'es' ? 'Otras divisas vs. Colón (CRC)' : 'Other currencies vs. Colón (CRC)'}
          </div>
          {live && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 600, color: 'var(--income)',
              background: 'var(--income-soft)', borderRadius: 999, padding: '2px 8px',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--income)', display: 'inline-block' }} />
              LIVE
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
          {lang === 'es' ? 'Tipo de cambio referencial · Currency API' : 'Reference exchange rate · Currency API'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                <Skeleton w={36} h={36} radius={10} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton w={140} h={13} />
                  <Skeleton w={100} h={11} />
                </div>
                <Skeleton w={60} h={18} />
                <Skeleton w={44} h={14} />
              </div>
            ))
          ) : (
            rates.map((rate, i) => (
              <div key={rate.code} style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr auto auto',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: i < rates.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <CurrencyBadge cc={rate.cc} size={36} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                    {rate.code} · {lang === 'es' ? rate.name_es : rate.name_en}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {lang === 'es'
                      ? `Compra ₡${rate.buy.toLocaleString()} / Venta ₡${rate.sell.toLocaleString()}`
                      : `Buy ₡${rate.buy.toLocaleString()} / Sell ₡${rate.sell.toLocaleString()}`}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>
                  ₡{rate.crc.toLocaleString()}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 11.5, fontWeight: 600,
                  color: rate.up ? 'var(--income)' : 'var(--expense)',
                  minWidth: 52, justifyContent: 'flex-end',
                }}>
                  <Icon name={rate.up ? 'arrow-up' : 'arrow-down'} size={10} stroke={2.5} />
                  {rate.up ? '+' : ''}{rate.change}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

function RatePill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 3,
      padding: '8px 14px',
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </span>
      <span className="mono" style={{ fontSize: 16, fontWeight: 700, color }}>
        {value}
      </span>
    </div>
  );
}

function ConverterField({ symbol, code, value, onChange, placeholder, readOnly = false }: {
  symbol: string; code: string; value: string;
  onChange?: (v: string) => void;
  placeholder?: string; readOnly?: boolean;
}) {
  return (
    <div style={{
      flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)', padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>
        {code}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="mono" style={{ fontSize: 18, color: 'var(--text-3)', fontWeight: 600 }}>{symbol}</span>
        <input
          value={value}
          onChange={e => onChange?.(e.target.value.replace(/[^0-9.]/g, ''))}
          readOnly={readOnly}
          placeholder={placeholder}
          style={{
            flex: 1, background: 'transparent', border: 0, outline: 0,
            fontSize: 22, fontWeight: 700, color: 'var(--text)',
            fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em',
          }}
        />
      </div>
    </div>
  );
}
