import { NextResponse } from 'next/server';

export const revalidate = 3600; // revalidate every hour

const CODES = ['crc', 'eur', 'gbp', 'mxn', 'cad', 'jpy'];

// Map currency code → static metadata kept in sync with FX_RATES
const META: Record<string, { symbol: string; cc: string; name_es: string; name_en: string }> = {
  USD: { symbol: '$',    cc: 'US', name_es: 'Dólar americano',  name_en: 'US Dollar'       },
  EUR: { symbol: '€',    cc: 'EU', name_es: 'Euro',             name_en: 'Euro'             },
  GBP: { symbol: '£',    cc: 'GB', name_es: 'Libra esterlina',  name_en: 'British pound'   },
  MXN: { symbol: 'MX$',  cc: 'MX', name_es: 'Peso mexicano',    name_en: 'Mexican peso'    },
  CAD: { symbol: 'CA$',  cc: 'CA', name_es: 'Dólar canadiense', name_en: 'Canadian dollar' },
  JPY: { symbol: '¥',    cc: 'JP', name_es: 'Yen japonés',      name_en: 'Japanese yen'    },
};

function prevDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function fetchRates(date: 'latest' | string): Promise<Record<string, number> | null> {
  // Primary: fawazahmed0 currency API (free, no key, CDN-cached, has CRC)
  const primaryUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.json`;
  // Fallback: open.er-api.com (free, no key, has CRC)
  const fallbackUrl = `https://open.er-api.com/v6/latest/USD`;

  try {
    const res = await fetch(primaryUrl, {
      next: { revalidate: date === 'latest' ? 3600 : 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      // fawazahmed0 returns { date: "...", usd: { crc: 513, eur: 0.918, ... } }
      if (data.usd) return data.usd as Record<string, number>;
    }
  } catch { /* try fallback */ }

  if (date !== 'latest') return null;

  try {
    const res = await fetch(fallbackUrl, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      // open.er-api returns { rates: { CRC: 513, EUR: 0.918, ... } }
      if (data.rates) {
        // normalise to lowercase keys matching fawazahmed0 format
        const norm: Record<string, number> = {};
        for (const [k, v] of Object.entries(data.rates as Record<string, number>)) {
          norm[k.toLowerCase()] = v;
        }
        return norm;
      }
    }
  } catch { /* nothing */ }

  return null;
}

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

async function fetchHistory(): Promise<Array<{ month: string; rate: number }>> {
  const now = new Date();
  const entries = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      date: d.toISOString().slice(0, 10),
      label: `${MONTHS_ES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
    };
  });

  const results = await Promise.allSettled(
    entries.map(({ date }) => fetchRates(date).then(r => r?.crc ?? null))
  );

  return entries
    .map(({ label }, i) => {
      const res = results[i];
      const rate = res.status === 'fulfilled' && res.value ? Math.round(res.value) : null;
      return rate ? { month: label, rate } : null;
    })
    .filter(Boolean) as Array<{ month: string; rate: number }>;
}

export async function GET() {
  const [today, prev, history] = await Promise.all([
    fetchRates('latest'),
    fetchRates(prevDate()),
    fetchHistory(),
  ]);

  if (!today) {
    return NextResponse.json({ error: 'Unable to fetch exchange rates' }, { status: 503 });
  }

  const fallback = prev ?? today;
  const crcPerUsd = today.crc ?? 510;

  // Build USD first (special case: 1 USD → CRC)
  const usdCrc  = Math.round(crcPerUsd);
  const usdPrev = Math.round(fallback.crc ?? crcPerUsd);
  const usdChange = usdPrev > 0 ? +((usdCrc - usdPrev) / usdPrev * 100).toFixed(2) : 0;

  const rates = [
    {
      code: 'USD',
      crc:  usdCrc,
      buy:  usdCrc - 2,
      sell: usdCrc + 2,
      change: usdChange,
      up:   usdChange >= 0,
    },
    ...CODES
      .filter(code => code !== 'crc' && today[code])
      .map(code => {
        const crc     = Math.round(crcPerUsd / today[code]);
        const crcPrev = fallback[code] ? Math.round((fallback.crc ?? crcPerUsd) / fallback[code]) : crc;
        const change  = crcPrev > 0 ? +((crc - crcPrev) / crcPrev * 100).toFixed(2) : 0;
        const spread  = Math.max(1, Math.round(crc * 0.004));
        return {
          code: code.toUpperCase(),
          crc,
          buy:  crc - spread,
          sell: crc + spread,
          change,
          up:   change >= 0,
        };
      }),
  ].map(r => ({ ...r, ...META[r.code] }));

  const date = new Date().toISOString().slice(0, 10);

  return NextResponse.json({ rates, date, live: true, history }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
