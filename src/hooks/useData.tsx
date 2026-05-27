'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import {
  fetchProfile, fetchAccounts, fetchTransactions, fetchPendingTransactions, fetchFixedConfirmations, fetchBudgets,
  fetchSavingsGoals, fetchUnreadNotificationsCount, fetchNotifications, markAllNotificationsRead,
  insertTransaction, insertAccount, insertBudget, insertSavingsGoal, upsertProfile,
  updateTransaction, deleteTransaction, confirmPendingTransaction,
  updateAccount, deleteAccount,
  updateBudgetByCategory, deleteBudgetByCategory,
  updateSavingsGoal, deleteSavingsGoalById,
  addGoalContribution,
  toAccount, toMovement, toBudget, toGoal,
  type DbProfile, type DbNotification, type NewTransaction, type NewAccount, type NewBudget, type NewSavingsGoal,
} from '@/lib/db';
import type { Account, Movement, Budget, SavingsGoal } from '@/lib/data';
import { FX } from '@/lib/data';

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
  pendingMovements: Movement[];
  budgets: Budget[];
  goals: SavingsGoal[];
  yearEvolution: YearPoint[];
  notifications: DbNotification[];
  fixedConfirmations: { template_id: string; period_key: string }[];
  unreadNotifications: number;
  liveUsdRate: number;
  loading: boolean;
  markAllRead: () => Promise<void>;
  addTransaction: (tx: NewTransaction) => Promise<void>;
  addAccount: (data: NewAccount) => Promise<void>;
  addBudget: (data: NewBudget) => Promise<void>;
  addGoal: (data: NewSavingsGoal) => Promise<void>;
  saveProfile: (patch: Partial<Pick<DbProfile, 'full_name' | 'default_currency' | 'language' | 'theme' | 'avatar_url'>>) => Promise<void>;
  refetch: () => Promise<void>;
  updateTransaction: (id: string, data: Parameters<typeof updateTransaction>[1], old: { type: 'income' | 'expense'; amount: number; account: string; date?: string }) => Promise<void>;
  deleteTransaction: (id: string, type: 'income' | 'expense', amount: number, accountId: string) => Promise<void>;
  updateAccount: (id: string, data: { name?: string; type?: string; color?: string; currency?: string; credit_limit?: number | null; last_digits?: string | null }) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  updateBudget: (cat: string, limit_amount: number) => Promise<void>;
  deleteBudget: (cat: string) => Promise<void>;
  updateGoal: (id: string, data: { name?: string; description?: string | null; icon?: string; target_amount?: number; target_date?: string | null; status?: string }) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addContribution: (goalId: string, accountId: string, goalAmount: number, accountAmount: number, note?: string) => Promise<void>;
  confirmPending: (id: string) => Promise<void>;
}

const DataCtx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [pendingMovements, setPendingMovements] = useState<Movement[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [yearEvolution, setYearEvolution] = useState<YearPoint[]>([]);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [fixedConfirmations, setFixedConfirmations] = useState<{ template_id: string; period_key: string }[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [liveUsdRate, setLiveUsdRate] = useState(510);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data: { user: authUser } } = await sb.auth.getUser();
      if (!authUser) { setLoading(false); return; }
      setUser({ id: authUser.id, email: authUser.email ?? '' });

      const [dbAccts, dbTxs, dbPending, dbBudgets, dbProfile, dbGoals, unreadCount, dbNotifs, dbFixedConfs] = await Promise.all([
        fetchAccounts(),
        fetchTransactions(),
        fetchPendingTransactions(),
        fetchBudgets(),
        fetchProfile(),
        fetchSavingsGoals(),
        fetchUnreadNotificationsCount(),
        fetchNotifications(),
        fetchFixedConfirmations(),
      ]);

      const lang = dbProfile?.language ?? 'es';
      const accs = dbAccts.map(toAccount);
      const movs = dbTxs.map(toMovement);
      const pending = dbPending.map(toMovement);
      setAccounts(accs);
      setMovements(movs);
      setPendingMovements(pending);
      setBudgets(dbBudgets.map(b => toBudget(b, movs)));
      setGoals(dbGoals.map(toGoal));
      setNotifications(dbNotifs);
      setFixedConfirmations(dbFixedConfs);
      setUnreadNotifications(unreadCount);
      setProfile(dbProfile);
      setYearEvolution(buildYearEvolution(movs, lang));

      // Fetch live USD/CRC rate and update global FX for all fmtMoney calls
      try {
        const fxRes = await fetch('/api/fx');
        if (fxRes.ok) {
          const { rates } = await fxRes.json();
          const usd = (rates as { code: string; crc: number }[]).find(r => r.code === 'USD');
          if (usd?.crc) {
            FX.USD = 1 / usd.crc;
            setLiveUsdRate(usd.crc);
          }
        }
      } catch { /* keep static fallback */ }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep session alive: re-load on token refresh, redirect on sign-out
  useEffect(() => {
    const sb = createClient();
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setAccounts([]);
        setMovements([]);
        setPendingMovements([]);
        setFixedConfirmations([]);
        router.push('/login');
      } else if (event === 'TOKEN_REFRESHED') {
        load();
      }
    });
    return () => subscription.unsubscribe();
  }, [load, router]);

  const addTransaction = useCallback(async (tx: NewTransaction) => {
    await insertTransaction(tx);
    await load();
  }, [load]);

  const addAccount = useCallback(async (data: NewAccount) => {
    await insertAccount(data);
    await load();
  }, [load]);

  const addBudget = useCallback(async (data: NewBudget) => {
    await insertBudget(data);
    await load();
  }, [load]);

  const addGoal = useCallback(async (data: NewSavingsGoal) => {
    await insertSavingsGoal(data);
    await load();
  }, [load]);

  const updateTx = useCallback(async (id: string, data: Parameters<typeof updateTransaction>[1], old: { type: 'income' | 'expense'; amount: number; account: string; date?: string }) => {
    await updateTransaction(id, { ...data, oldType: old.type, oldAmount: old.amount, oldAccountId: old.account, oldDate: old.date });
    await load();
  }, [load]);

  const deleteTx = useCallback(async (id: string, type: 'income' | 'expense', amount: number, accountId: string) => {
    await deleteTransaction(id, type, amount, accountId);
    await load();
  }, [load]);

  const updateAcc = useCallback(async (id: string, data: { name?: string; type?: string; color?: string; currency?: string; credit_limit?: number | null; last_digits?: string | null }) => {
    await updateAccount(id, data);
    await load();
  }, [load]);

  const deleteAcc = useCallback(async (id: string) => {
    await deleteAccount(id);
    await load();
  }, [load]);

  const updateBudget2 = useCallback(async (cat: string, limit_amount: number) => {
    await updateBudgetByCategory(cat, limit_amount);
    await load();
  }, [load]);

  const deleteBudget2 = useCallback(async (cat: string) => {
    await deleteBudgetByCategory(cat);
    await load();
  }, [load]);

  const updateGoal2 = useCallback(async (id: string, data: { name?: string; description?: string | null; icon?: string; target_amount?: number; target_date?: string | null; status?: string }) => {
    await updateSavingsGoal(id, data);
    await load();
  }, [load]);

  const deleteGoal2 = useCallback(async (id: string) => {
    await deleteSavingsGoalById(id);
    await load();
  }, [load]);

  const addContribution = useCallback(async (goalId: string, accountId: string, goalAmount: number, accountAmount: number, note?: string) => {
    await addGoalContribution(goalId, accountId, goalAmount, accountAmount, note);
    await load();
  }, [load]);

  const confirmPending = useCallback(async (id: string) => {
    await confirmPendingTransaction(id);
    await load();
  }, [load]);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadNotifications(0);
  }, []);

  const saveProfile = useCallback(async (
    patch: Partial<Pick<DbProfile, 'full_name' | 'default_currency' | 'language' | 'theme' | 'avatar_url'>>
  ) => {
    await upsertProfile(patch);
    setProfile(prev => prev ? { ...prev, ...patch } : null);
  }, []);

  return (
    <DataCtx.Provider value={{
      user, profile, accounts, movements, pendingMovements, budgets, goals, yearEvolution,
      notifications, fixedConfirmations, unreadNotifications, liveUsdRate, loading,
      markAllRead,
      addTransaction, addAccount, addBudget, addGoal,
      saveProfile, refetch: load,
      updateTransaction: updateTx,
      deleteTransaction: deleteTx,
      updateAccount: updateAcc,
      deleteAccount: deleteAcc,
      updateBudget: updateBudget2,
      deleteBudget: deleteBudget2,
      updateGoal: updateGoal2,
      deleteGoal: deleteGoal2,
      addContribution,
      confirmPending,
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
