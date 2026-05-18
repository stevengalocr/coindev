'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { I18N, type Lang, type Currency, type T } from '@/lib/data';

interface AppState {
  lang: Lang;
  currency: Currency;
  theme: 'dark' | 'light';
  t: T;
  setLang: (l: Lang) => void;
  setCurrency: (c: Currency) => void;
  setTheme: (t: 'dark' | 'light') => void;
}

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');
  const [currency, setCurrencyState] = useState<Currency>('CRC');
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const setCurrency = useCallback((c: Currency) => setCurrencyState(c), []);
  const setTheme = useCallback((t: 'dark' | 'light') => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  return (
    <AppCtx.Provider value={{ lang, currency, theme, t: I18N[lang], setLang, setCurrency, setTheme }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
