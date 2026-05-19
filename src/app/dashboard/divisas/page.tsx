'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { FX_RATES, FX_HISTORY } from '@/lib/data';
import { Icon } from '@/components/ui/Icon';
import { Sparkline } from '@/components/shell/Charts';

export default function DivisasPage() {
  const { t, lang } = useApp();
  const [fromCRC, setFromCRC] = useState(true);
  const [amount, setAmount] = useState('');

  const usd = FX_RATES[0];
  const parsed = parseFloat(amount) || 0;
  const converted = parsed > 0
    ? fromCRC
      ? (parsed / usd.crc).toFixed(2)
      : Math.round(parsed * usd.crc).toLocaleString('es-CR')
    : '';

  const historyValues = FX_HISTORY.map(h => h.rate);

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            {t.divisas}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--income)', display: 'inline-block', flexShrink: 0 }} />
            {lang === 'es' ? 'Datos referenciales · BCCR' : 'Reference data · BCCR'}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'right' }}>
          <div>{lang === 'es' ? 'Actualizado' : 'Updated'}</div>
          <div style={{ color: 'var(--text-2)', fontWeight: 500 }}>18 May 2026, 09:00</div>
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

          {/* Left */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>🇺🇸</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {lang === 'es' ? 'Dólar Americano' : 'US Dollar'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>USD / CRC</div>
              </div>
              <span style={{
                marginLeft: 'auto',
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '3px 9px', borderRadius: 999,
                background: 'var(--income-soft)', color: 'var(--income)',
                fontSize: 11, fontWeight: 600,
              }}>
                <Icon name="arrow-up" size={9} stroke={2.5} />
                +{usd.change}%
              </span>
            </div>

            <div className="mono" style={{ fontSize: 44, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              ₡{usd.crc.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              {lang === 'es' ? 'por 1 dólar americano' : 'per 1 US dollar'}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <RatePill label={lang === 'es' ? 'Compra' : 'Buy'} value={`₡${usd.buy}`} color="var(--income)" />
              <RatePill label={lang === 'es' ? 'Venta' : 'Sell'} value={`₡${usd.sell}`} color="var(--expense)" />
            </div>
          </div>

          {/* Right: sparkline */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {lang === 'es' ? 'Últimos 12 meses' : 'Last 12 months'}
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
          <span className="mono">1 USD = ₡{usd.crc}</span>
          <span className="mono">1 CRC = ${(1 / usd.crc).toFixed(6)}</span>
        </div>
      </div>

      {/* Rate table */}
      <div className="cd-card" style={{ padding: '20px 22px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 4 }}>
          {lang === 'es' ? 'Otras divisas vs. Colón (CRC)' : 'Other currencies vs. Colón (CRC)'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
          {lang === 'es' ? 'Tipo de cambio referencial BCCR' : 'BCCR reference exchange rate'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {FX_RATES.map((rate, i) => (
            <div key={rate.code} style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto auto',
              alignItems: 'center',
              gap: 12,
              padding: '11px 0',
              borderBottom: i < FX_RATES.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{rate.flag}</span>
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
                minWidth: 48, justifyContent: 'flex-end',
              }}>
                <Icon name={rate.up ? 'arrow-up' : 'arrow-down'} size={10} stroke={2.5} />
                {rate.up ? '+' : ''}{rate.change}%
              </div>
            </div>
          ))}
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
