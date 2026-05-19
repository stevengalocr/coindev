'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { I18N, type Lang, type Currency, type T } from '@/lib/data';

interface AppState {
  lang: Lang;
  currency: Currency;
  theme: 'dark' | 'light';
  t: T;
  setLang: (l: Lang) => void;
  setCurrency: (c: Currency) => void;
  setTheme: (t: 'dark' | 'light') => void;
  signOut: () => Promise<void>;
}

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>('es');
  const [currency, setCurrencyState] = useState<Currency>('CRC');
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const setCurrency = useCallback((c: Currency) => setCurrencyState(c), []);
  const setTheme = useCallback((t: 'dark' | 'light') => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const signOut = useCallback(async () => {
    const sb = createClient();
    await sb.auth.signOut();
    router.push('/login');
  }, [router]);

  return (
    <AppCtx.Provider value={{ lang, currency, theme, t: I18N[lang], setLang, setCurrency, setTheme, signOut }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
