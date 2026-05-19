import { createClient } from './supabase';
import type { Account, Movement, Budget, SavingsGoal } from './data';

// ── Category slug ↔ DB UUID mapping ────────────────────────────────
export const CAT_TO_DB: Record<string, string> = {
  salary:    '6c782625-6722-43d5-91b3-b97343d96c40',
  freelance: 'fd9e3747-7e4b-4ca1-be28-e651a24abbff',
  rent:      'c30706ec-5bbc-4918-9dd6-2378785371da',
  groceries: 'ad5f772f-99eb-437f-9cbf-5e73b763c4af',
  food:      'ad5f772f-99eb-437f-9cbf-5e73b763c4af',
  transport: '6880e3d5-6343-4dce-87d0-39dc1e45a706',
  health:    '1d18a93f-4e6d-4872-9bfb-f9bab1d5005b',
  fun:       '6a997c6e-6c5d-480e-b2f4-3bca174c40d6',
  subs:      '7eb9598a-aed6-4314-98f2-9a8be1133369',
  utilities: '13df4afe-312c-487d-84f6-71c89204637c',
};

const DB_TO_CAT: Record<string, string> = {
  '6c782625-6722-43d5-91b3-b97343d96c40': 'salary',
  'fd9e3747-7e4b-4ca1-be28-e651a24abbff': 'freelance',
  'c30706ec-5bbc-4918-9dd6-2378785371da': 'rent',
  'ad5f772f-99eb-437f-9cbf-5e73b763c4af': 'groceries',
  '6880e3d5-6343-4dce-87d0-39dc1e45a706': 'transport',
  '1d18a93f-4e6d-4872-9bfb-f9bab1d5005b': 'health',
  '6a997c6e-6c5d-480e-b2f4-3bca174c40d6': 'fun',
  '7eb9598a-aed6-4314-98f2-9a8be1133369': 'subs',
  '13df4afe-312c-487d-84f6-71c89204637c': 'utilities',
};

// ── Account type mapping ────────────────────────────────────────────
const DB_ACC_TYPE: Record<string, Account['kind']> = {
  checking:    'bank',
  savings:     'savings',
  cash:        'cash',
  credit_card: 'credit',
  investment:  'savings',
  other:       'bank',
};

export const APP_TO_DB_ACC: Record<string, string> = {
  bank:    'checking',
  savings: 'savings',
  cash:    'cash',
  credit:  'credit_card',
};

// ── DB types ────────────────────────────────────────────────────────
export interface DbProfile {
  id: string;
  full_name: string | null;
  email: string;
  default_currency: string;
  language: string;
  theme: string;
  plan: string;
}

export interface DbAccount {
  id: string;
  name: string;
  type: string;
  current_balance: number;
  currency: string;
  credit_limit: number | null;
  color: string;
  last_digits: string | null;
  is_active: boolean;
}

export interface DbTransaction {
  id: string;
  account_id: string;
  category_id: string | null;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  notes: string | null;
  date: string;
  is_fixed: boolean;
  status: string;
}

export interface DbBudget {
  id: string;
  category_id: string;
  limit_amount: number;
  period: string;
}

export interface DbSavingsGoal {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
}

export interface DbNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface DbExchangeRate {
  currency: string;
  rate: number;
  fetched_at: string;
}

// ── Converters ──────────────────────────────────────────────────────
export function toAccount(a: DbAccount): Account {
  return {
    id: a.id,
    name: a.name,
    kind: DB_ACC_TYPE[a.type] ?? 'bank',
    balance: Number(a.current_balance),
    color: a.color,
    tail: a.last_digits ? `••${a.last_digits}` : '',
    limit: a.credit_limit != null ? Number(a.credit_limit) : undefined,
  };
}

export function toMovement(t: DbTransaction): Movement {
  const cat = t.notes ?? DB_TO_CAT[t.category_id ?? ''] ?? 'fun';
  return {
    id: t.id,
    type: t.type === 'transfer' ? 'expense' : t.type,
    cat,
    amount: Number(t.amount),
    account: t.account_id,
    date: new Date(t.date + 'T12:00:00'),
    desc: t.description,
    fixed: t.is_fixed,
  };
}

export function toBudget(b: DbBudget, movements: Movement[]): Budget {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const catSlug = DB_TO_CAT[b.category_id] ?? b.category_id;
  const spent = movements
    .filter(m => m.type === 'expense' && m.cat === catSlug && m.date >= monthStart)
    .reduce((s, m) => s + m.amount, 0);
  return { cat: catSlug, limit: Number(b.limit_amount), spent };
}

// ── Queries ─────────────────────────────────────────────────────────
export async function fetchProfile(): Promise<DbProfile | null> {
  const sb = createClient();
  const { data } = await sb.from('profiles').select('*').single();
  return data as DbProfile | null;
}

export async function upsertProfile(patch: Partial<Pick<DbProfile, 'full_name' | 'default_currency' | 'language' | 'theme'>>): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await sb.from('profiles').update(patch).eq('id', user.id);
}

export async function fetchAccounts(): Promise<DbAccount[]> {
  const sb = createClient();
  const { data } = await sb
    .from('accounts')
    .select('id,name,type,current_balance,currency,credit_limit,color,last_digits,is_active')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('created_at');
  return (data ?? []) as DbAccount[];
}

export async function fetchTransactions(): Promise<DbTransaction[]> {
  const sb = createClient();
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const { data } = await sb
    .from('transactions')
    .select('id,account_id,category_id,type,amount,description,notes,date,is_fixed,status')
    .is('deleted_at', null)
    .eq('status', 'confirmed')
    .gte('date', yearStart)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  return (data ?? []) as DbTransaction[];
}

export async function fetchBudgets(): Promise<DbBudget[]> {
  const sb = createClient();
  const { data } = await sb
    .from('budgets')
    .select('id,category_id,limit_amount,period')
    .eq('is_active', true)
    .eq('period', 'monthly');
  return (data ?? []) as DbBudget[];
}

// ── Mutations ───────────────────────────────────────────────────────

export interface NewAccount {
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'credit_card';
  initial_balance: number;
  color: string;
  currency?: string;
  credit_limit?: number;
  last_digits?: string;
}

export async function insertAccount(data: NewAccount): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await sb.from('accounts').insert({
    user_id: user.id,
    name: data.name,
    type: data.type,
    current_balance: data.initial_balance,
    currency: data.currency ?? 'CRC',
    color: data.color,
    credit_limit: data.credit_limit ?? null,
    last_digits: data.last_digits ?? null,
    is_active: true,
  });
  if (error) throw error;
}

export interface NewBudget {
  cat: string;
  limit_amount: number;
}

export async function insertBudget(data: NewBudget): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const category_id = CAT_TO_DB[data.cat] ?? null;
  if (!category_id) throw new Error('Categoría inválida');
  const { error } = await sb.from('budgets').insert({
    user_id: user.id,
    category_id,
    limit_amount: data.limit_amount,
    period: 'monthly',
    is_active: true,
  });
  if (error) throw error;
}

export interface NewSavingsGoal {
  name: string;
  description?: string;
  icon: string;
  target_amount: number;
  currency?: string;
  target_date?: string;
}

export async function insertSavingsGoal(data: NewSavingsGoal): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await sb.from('savings_goals').insert({
    user_id: user.id,
    name: data.name,
    description: data.description ?? null,
    icon: data.icon,
    target_amount: data.target_amount,
    current_amount: 0,
    currency: data.currency ?? 'CRC',
    target_date: data.target_date ?? null,
    status: 'active',
  });
  if (error) throw error;
}

export interface NewTransaction {
  type: 'income' | 'expense';
  cat: string;
  amount: number;
  account_id: string;
  date: string;
  description: string;
  is_fixed: boolean;
}

export async function insertTransaction(tx: NewTransaction): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const category_id = CAT_TO_DB[tx.cat] ?? null;
  const { error } = await sb.from('transactions').insert({
    user_id: user.id,
    account_id: tx.account_id,
    category_id,
    type: tx.type,
    amount: tx.amount,
    currency: 'CRC',
    description: tx.description,
    notes: tx.cat,
    date: tx.date,
    is_fixed: tx.is_fixed,
    status: 'confirmed',
  });
  if (error) throw error;

  // Update account balance
  const { data: acc } = await sb
    .from('accounts')
    .select('current_balance')
    .eq('id', tx.account_id)
    .single();
  if (acc) {
    const delta = tx.type === 'income' ? tx.amount : -tx.amount;
    await sb
      .from('accounts')
      .update({ current_balance: Number(acc.current_balance) + delta })
      .eq('id', tx.account_id);
  }
}

export function toGoal(g: DbSavingsGoal): SavingsGoal {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    icon: g.icon || '🎯',
    target: Number(g.target_amount),
    current: Number(g.current_amount),
    currency: g.currency,
    targetDate: g.target_date ? new Date(g.target_date) : null,
    status: g.status,
  };
}

export async function fetchSavingsGoals(): Promise<DbSavingsGoal[]> {
  const sb = createClient();
  const { data } = await sb
    .from('savings_goals')
    .select('id,name,description,icon,target_amount,current_amount,currency,target_date,status')
    .is('deleted_at', null)
    .in('status', ['active', 'completed', 'paused'])
    .order('created_at', { ascending: false });
  return (data ?? []) as DbSavingsGoal[];
}

export async function fetchUnreadNotificationsCount(): Promise<number> {
  const sb = createClient();
  const { count } = await sb
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);
  return count ?? 0;
}

// ── Update / Delete ─────────────────────────────────────────────────

export async function updateTransaction(id: string, data: {
  type?: 'income' | 'expense';
  cat?: string;
  amount?: number;
  account_id?: string;
  date?: string;
  description?: string;
  is_fixed?: boolean;
  oldType?: 'income' | 'expense';
  oldAmount?: number;
  oldAccountId?: string;
}): Promise<void> {
  const sb = createClient();
  const updates: Record<string, unknown> = {};
  if (data.type !== undefined) updates.type = data.type;
  if (data.cat !== undefined) { updates.category_id = CAT_TO_DB[data.cat] ?? null; updates.notes = data.cat; }
  if (data.amount !== undefined) updates.amount = data.amount;
  if (data.account_id !== undefined) updates.account_id = data.account_id;
  if (data.date !== undefined) updates.date = data.date;
  if (data.description !== undefined) updates.description = data.description;
  if (data.is_fixed !== undefined) updates.is_fixed = data.is_fixed;
  const { error } = await sb.from('transactions').update(updates).eq('id', id);
  if (error) throw error;

  // Adjust account balance
  const oldEffect = data.oldType === 'income' ? (data.oldAmount ?? 0) : -(data.oldAmount ?? 0);
  const newType = data.type ?? data.oldType ?? 'expense';
  const newAmount = data.amount ?? data.oldAmount ?? 0;
  const newEffect = newType === 'income' ? newAmount : -newAmount;
  const delta = newEffect - oldEffect;
  const accId = data.account_id ?? data.oldAccountId;
  if (delta !== 0 && accId) {
    const { data: acc } = await sb.from('accounts').select('current_balance').eq('id', accId).single();
    if (acc) {
      await sb.from('accounts').update({ current_balance: Number(acc.current_balance) + delta }).eq('id', accId);
    }
  }
}

export async function deleteTransaction(id: string, type: 'income' | 'expense', amount: number, accountId: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('transactions').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  // Revert balance
  const delta = type === 'income' ? -amount : amount;
  const { data: acc } = await sb.from('accounts').select('current_balance').eq('id', accountId).single();
  if (acc) {
    await sb.from('accounts').update({ current_balance: Number(acc.current_balance) + delta }).eq('id', accountId);
  }
}

export async function updateAccount(id: string, data: { name?: string; type?: string; color?: string; credit_limit?: number | null; last_digits?: string | null }): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('accounts').update(data).eq('id', id);
  if (error) throw error;
}

export async function deleteAccount(id: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('accounts').update({ is_active: false, deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function updateBudgetByCategory(cat: string, limit_amount: number): Promise<void> {
  const sb = createClient();
  const category_id = CAT_TO_DB[cat] ?? null;
  if (!category_id) throw new Error('Categoría inválida');
  const { error } = await sb.from('budgets').update({ limit_amount }).eq('category_id', category_id).eq('is_active', true);
  if (error) throw error;
}

export async function deleteBudgetByCategory(cat: string): Promise<void> {
  const sb = createClient();
  const category_id = CAT_TO_DB[cat] ?? null;
  if (!category_id) throw new Error('Categoría inválida');
  const { error } = await sb.from('budgets').update({ is_active: false }).eq('category_id', category_id);
  if (error) throw error;
}

export async function updateSavingsGoal(id: string, data: { name?: string; description?: string | null; icon?: string; target_amount?: number; target_date?: string | null; status?: string }): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('savings_goals').update(data).eq('id', id);
  if (error) throw error;
}

export async function deleteSavingsGoalById(id: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('savings_goals').update({ status: 'cancelled', deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function fetchLatestExchangeRate(currency: string): Promise<number | null> {
  const sb = createClient();
  const { data } = await sb
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', 'USD')
    .eq('currency', currency)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();
  return data?.rate ?? null;
}

