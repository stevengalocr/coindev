'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import {
  fetchProfile, fetchAccounts, fetchTransactions, fetchBudgets,
  insertTransaction, upsertProfile,
  toAccount, toMovement, toBudget,
  type DbProfile, type NewTransaction,
} from '@/lib/db';
import type { Account, Movement, Budget } from '@/lib/data';

export interface YearPoint { m: string; income: number; expense: number; future: boolean }

const MONTH_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTH_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildYearEvolution(movements: Movement[], lang: string): YearPoint[] {
  const now = new Date();
  const year = now.getFullYear();
  const cur = now.getMonth();
  const labels = lang === 'es' ? MONTH_ES : MONTH_EN;
  return Array.from({ length: 12 }, (_, i) => {
    if (i > cur) return { m: labels[i], income: 0, expense: 0, future: true };
    const ms = movements.filter(m => m.date.getFullYear() === year && m.date.getMonth() === i);
    return {
      m: labels[i],
      income: ms.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0),
      expense: ms.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0),
      future: false,
    };
  });
}

interface DataState {
  user: { id: string; email: string } | null;
  profile: DbProfile | null;
  accounts: Account[];
  movements: Movement[];
  budgets: Budget[];
  yearEvolution: YearPoint[];
  loading: boolean;
  addTransaction: (tx: NewTransaction) => Promise<void>;
  saveProfile: (patch: Partial<Pick<DbProfile, 'full_name' | 'default_currency' | 'language' | 'theme'>>) => Promise<void>;
  refetch: () => Promise<void>;
}

const DataCtx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [yearEvolution, setYearEvolution] = useState<YearPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data: { user: authUser } } = await sb.auth.getUser();
      if (!authUser) { setLoading(false); return; }
      setUser({ id: authUser.id, email: authUser.email ?? '' });

      const [dbAccts, dbTxs, dbBudgets, dbProfile] = await Promise.all([
        fetchAccounts(),
        fetchTransactions(),
        fetchBudgets(),
        fetchProfile(),
      ]);

      const lang = dbProfile?.language ?? 'es';
      const accs = dbAccts.map(toAccount);
      const movs = dbTxs.map(toMovement);
      setAccounts(accs);
      setMovements(movs);
      setBudgets(dbBudgets.map(b => toBudget(b, movs)));
      setProfile(dbProfile);
      setYearEvolution(buildYearEvolution(movs, lang));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTransaction = useCallback(async (tx: NewTransaction) => {
    await insertTransaction(tx);
    await load();
  }, [load]);

  const saveProfile = useCallback(async (
    patch: Partial<Pick<DbProfile, 'full_name' | 'default_currency' | 'language' | 'theme'>>
  ) => {
    await upsertProfile(patch);
    setProfile(prev => prev ? { ...prev, ...patch } : null);
  }, []);

  return (
    <DataCtx.Provider value={{
      user, profile, accounts, movements, budgets, yearEvolution,
      loading, addTransaction, saveProfile, refetch: load,
    }}>
      {children}
    </DataCtx.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}
