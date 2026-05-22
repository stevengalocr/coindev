import { createClient } from './supabase';
import type { Account, Movement, Budget, SavingsGoal } from './data';

// ── Category slug ↔ DB UUID mapping ────────────────────────────────
export const CAT_TO_DB: Record<string, string> = {
  // Income
  salary:       '6c782625-6722-43d5-91b3-b97343d96c40',
  freelance:    'fd9e3747-7e4b-4ca1-be28-e651a24abbff',
  investments:  '71e681aa-f271-43f9-9528-dc2e126f59a5',
  bonuses:      '6fb5ba99-dab3-4a32-bf92-c5bddbcb3adf',
  other_income: 'cb5f3407-7bdd-4998-b384-1be8d63079fc',
  // Expense
  rent:         'c30706ec-5bbc-4918-9dd6-2378785371da',
  groceries:    'ad5f772f-99eb-437f-9cbf-5e73b763c4af',
  food:         'ad5f772f-99eb-437f-9cbf-5e73b763c4af',
  transport:    '6880e3d5-6343-4dce-87d0-39dc1e45a706',
  health:       '1d18a93f-4e6d-4872-9bfb-f9bab1d5005b',
  education:    '0e75fd81-348d-4aab-a0a2-3b44b1f69ce9',
  fun:          '6a997c6e-6c5d-480e-b2f4-3bca174c40d6',
  subs:         '7eb9598a-aed6-4314-98f2-9a8be1133369',
  clothing:     '21614e3c-a003-41fd-8352-3b9289f85b84',
  tech:         'e6fe52d4-2bb5-4436-b328-862028472b60',
  utilities:    '13df4afe-312c-487d-84f6-71c89204637c',
  credit_card:  '83a3850e-6214-43e3-9ae3-35d9d307c8fe',
  pets:         'b6a88898-29d9-4908-91df-faaa9bfd2f29',
  travel:       'f6ff4b8a-169e-45d8-877b-6a434949fccd',
  other:        'bd686c70-e04d-4c4a-8e71-c1bebb4a2e4b',
};

const DB_TO_CAT: Record<string, string> = {
  '6c782625-6722-43d5-91b3-b97343d96c40': 'salary',
  'fd9e3747-7e4b-4ca1-be28-e651a24abbff': 'freelance',
  '71e681aa-f271-43f9-9528-dc2e126f59a5': 'investments',
  '6fb5ba99-dab3-4a32-bf92-c5bddbcb3adf': 'bonuses',
  'cb5f3407-7bdd-4998-b384-1be8d63079fc': 'other_income',
  'c30706ec-5bbc-4918-9dd6-2378785371da': 'rent',
  'ad5f772f-99eb-437f-9cbf-5e73b763c4af': 'groceries',
  '6880e3d5-6343-4dce-87d0-39dc1e45a706': 'transport',
  '1d18a93f-4e6d-4872-9bfb-f9bab1d5005b': 'health',
  '0e75fd81-348d-4aab-a0a2-3b44b1f69ce9': 'education',
  '6a997c6e-6c5d-480e-b2f4-3bca174c40d6': 'fun',
  '7eb9598a-aed6-4314-98f2-9a8be1133369': 'subs',
  '21614e3c-a003-41fd-8352-3b9289f85b84': 'clothing',
  'e6fe52d4-2bb5-4436-b328-862028472b60': 'tech',
  '13df4afe-312c-487d-84f6-71c89204637c': 'utilities',
  '83a3850e-6214-43e3-9ae3-35d9d307c8fe': 'credit_card',
  'b6a88898-29d9-4908-91df-faaa9bfd2f29': 'pets',
  'f6ff4b8a-169e-45d8-877b-6a434949fccd': 'travel',
  'bd686c70-e04d-4c4a-8e71-c1bebb4a2e4b': 'other',
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
  plan_status: 'trial' | 'active' | 'pending_payment' | 'blocked';
  trial_started_at: string | null;
  plan_expires_at: string | null;
  admin_notes: string | null;
  created_at: string;
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
  recurrence_type: 'monthly' | 'weekly' | 'custom' | null;
  recurrence_value: number | null;
}

export interface DbBudget {
  id: string;
  category_id: string;
  limit_amount: number;
  currency: string;
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
    currency: a.currency ?? 'CRC',
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
    recurrence: t.recurrence_type
      ? { type: t.recurrence_type, value: t.recurrence_value ?? 1 }
      : null,
  };
}

export function toBudget(b: DbBudget, movements: Movement[]): Budget {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const catSlug = DB_TO_CAT[b.category_id] ?? b.category_id;
  const spent = movements
    .filter(m => m.type === 'expense' && m.cat === catSlug && m.date >= monthStart)
    .reduce((s, m) => s + m.amount, 0);
  return { cat: catSlug, limit: Number(b.limit_amount), spent, currency: b.currency ?? 'CRC' };
}

// ── Queries ─────────────────────────────────────────────────────────
export async function fetchProfile(): Promise<DbProfile | null> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) console.error('[fetchProfile]', error.message);
  return data as DbProfile | null;
}

export async function adminDeleteUser(targetUserId: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.rpc('admin_delete_user', { target_user_id: targetUserId });
  if (error) throw error;
}

export async function fetchAllProfiles(): Promise<DbProfile[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbProfile[];
}

export async function updateUserPlanStatus(
  userId: string,
  planStatus: DbProfile['plan_status'],
  adminNotes?: string
): Promise<void> {
  const sb = createClient();
  const patch: Record<string, unknown> = { plan_status: planStatus };
  if (adminNotes !== undefined) patch.admin_notes = adminNotes;
  const { error } = await sb.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
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
    .select('id,account_id,category_id,type,amount,description,notes,date,is_fixed,status,recurrence_type,recurrence_value')
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
    .select('id,category_id,limit_amount,currency,period')
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
  currency?: string;
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
    currency: data.currency ?? 'CRC',
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
  recurrence_type?: 'monthly' | 'weekly' | 'custom' | null;
  recurrence_value?: number | null;
}

export async function insertTransaction(tx: NewTransaction): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch account currency and balance before inserting
  const { data: acc } = await sb
    .from('accounts')
    .select('current_balance, currency')
    .eq('id', tx.account_id)
    .single();

  const category_id = CAT_TO_DB[tx.cat] ?? null;
  const { error } = await sb.from('transactions').insert({
    user_id: user.id,
    account_id: tx.account_id,
    category_id,
    type: tx.type,
    amount: tx.amount,
    currency: acc?.currency ?? 'CRC',
    description: tx.description,
    notes: tx.cat,
    date: tx.date,
    is_fixed: tx.is_fixed,
    recurrence_type: tx.recurrence_type ?? null,
    recurrence_value: tx.recurrence_value ?? null,
    status: 'confirmed',
  });
  if (error) throw error;

  // Update account balance
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

export interface DbGoalContribution {
  id: string;
  goal_id: string;
  account_id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export async function fetchGoalContributions(goalId: string): Promise<DbGoalContribution[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from('goal_contributions')
    .select('id, goal_id, account_id, amount, note, created_at')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as DbGoalContribution[];
}

export async function addGoalContribution(
  goalId: string,
  accountId: string,
  goalAmount: number,   // amount in goal's currency (credited to goal)
  accountAmount: number, // amount in account's currency (debited from account)
  note?: string
): Promise<void> {
  const sb = createClient();
  // Insert contribution record (stores goal-currency amount for history display)
  const { error: contribErr } = await sb
    .from('goal_contributions')
    .insert({ goal_id: goalId, account_id: accountId, amount: goalAmount, note: note ?? null });
  if (contribErr) throw contribErr;
  // Increase goal current_amount by goalAmount
  const { data: goal, error: goalErr } = await sb
    .from('savings_goals')
    .select('current_amount')
    .eq('id', goalId)
    .single();
  if (goalErr) throw goalErr;
  const { error: updateGoalErr } = await sb
    .from('savings_goals')
    .update({ current_amount: Number(goal.current_amount) + goalAmount })
    .eq('id', goalId);
  if (updateGoalErr) throw updateGoalErr;
  // Decrease account balance by accountAmount (in account's own currency)
  const { data: acc, error: accErr } = await sb
    .from('accounts')
    .select('current_balance')
    .eq('id', accountId)
    .single();
  if (accErr) throw accErr;
  const { error: updateAccErr } = await sb
    .from('accounts')
    .update({ current_balance: Number(acc.current_balance) - accountAmount })
    .eq('id', accountId);
  if (updateAccErr) throw updateAccErr;
}

export async function fetchUnreadNotificationsCount(): Promise<number> {
  const sb = createClient();
  const { count } = await sb
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);
  return count ?? 0;
}

export async function fetchNotifications(): Promise<DbNotification[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from('notifications')
    .select('id, type, title, body, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as DbNotification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('notifications').update({ is_read: true }).eq('is_read', false);
  if (error) throw error;
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
  recurrence_type?: 'monthly' | 'weekly' | 'custom' | null;
  recurrence_value?: number | null;
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
  if ('recurrence_type' in data) updates.recurrence_type = data.recurrence_type ?? null;
  if ('recurrence_value' in data) updates.recurrence_value = data.recurrence_value ?? null;
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

export async function updateAccount(id: string, data: { name?: string; type?: string; color?: string; currency?: string; credit_limit?: number | null; last_digits?: string | null }): Promise<void> {
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


// ── Feedback / Bug Reports ────────────────────────────────────────────────────

export type FeedbackType = 'bug' | 'mejora' | 'consulta';

export interface DbFeedback {
  id: string;
  user_id: string;
  email: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: 'nuevo' | 'en_revision' | 'resuelto';
  admin_reply: string | null;
  created_at: string;
}

export async function submitFeedback(data: {
  type: FeedbackType;
  title: string;
  description: string;
}): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await sb.from('feedback').insert({
    user_id: user.id,
    email: user.email,
    type: data.type,
    title: data.title,
    description: data.description,
    status: 'nuevo',
  });
  if (error) throw error;
}

export async function fetchAllFeedback(): Promise<DbFeedback[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbFeedback[];
}

export async function updateFeedbackStatus(
  id: string,
  status: DbFeedback['status'],
): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('feedback').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteFeedback(id: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('feedback').delete().eq('id', id);
  if (error) throw error;
}
