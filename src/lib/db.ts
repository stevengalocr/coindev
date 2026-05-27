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
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
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
    status: t.status as 'confirmed' | 'pending',
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
  const { data, error } = await sb.rpc('get_all_profiles_with_last_sign_in');
  if (error) throw error;
  return (data ?? []) as DbProfile[];
}

export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (mins < 2)   return 'Hace un momento';
  if (mins < 60)  return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days < 30)  return `Hace ${days} día${days === 1 ? '' : 's'}`;
  return `Hace ${months} mes${months === 1 ? '' : 'es'}`;
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

export async function upsertProfile(patch: Partial<Pick<DbProfile, 'full_name' | 'default_currency' | 'language' | 'theme' | 'avatar_url'>>): Promise<void> {
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

export async function fetchPendingTransactions(): Promise<DbTransaction[]> {
  const sb = createClient();
  // Fix #7: fixed templates have no meaningful date boundary so we exclude them from
  // the year filter; non-fixed drafts are bounded to the current year.
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const { data } = await sb
    .from('transactions')
    .select('id,account_id,category_id,type,amount,description,notes,date,is_fixed,status,recurrence_type,recurrence_value')
    .is('deleted_at', null)
    .eq('status', 'pending')
    .or(`is_fixed.eq.true,date.gte.${yearStart}`)
    .order('date', { ascending: true });
  return (data ?? []) as DbTransaction[];
}

// Fix #1: atomic via DB RPC — status + balance updated in one PG transaction
export async function confirmPendingTransaction(id: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.rpc('confirm_pending_tx', { p_tx_id: id });
  if (error) throw error;
}

// Fix #2: DB-backed period confirmations (replaces localStorage)
export async function fetchFixedConfirmations(): Promise<{ template_id: string; period_key: string }[]> {
  const sb = createClient();
  const { data } = await sb
    .from('fixed_confirmations')
    .select('template_id,period_key');
  return (data ?? []) as { template_id: string; period_key: string }[];
}

export async function insertFixedConfirmation(templateId: string, periodKey: string): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await sb.from('fixed_confirmations').upsert(
    { user_id: user.id, template_id: templateId, period_key: periodKey },
    { onConflict: 'user_id,template_id,period_key', ignoreDuplicates: true }
  );
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

function isDatePastOrToday(dateStr: string): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(dateStr + 'T12:00:00') <= today;
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

  const isPending = tx.is_fixed || !isDatePastOrToday(tx.date);

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
    status: isPending ? 'pending' : 'confirmed',
  });
  if (error) throw error;

  // Only update balance if NOT pending
  if (acc && !isPending) {
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

// Atomic via DB RPC — insert contribution + update goal + update account in one PG transaction
export async function addGoalContribution(
  goalId: string,
  accountId: string,
  goalAmount: number,    // amount in goal's currency (credited to goal)
  accountAmount: number, // amount in account's currency (debited from account)
  note?: string
): Promise<void> {
  const sb = createClient();
  const { error } = await sb.rpc('add_goal_contribution', {
    p_goal_id: goalId,
    p_account_id: accountId,
    p_goal_amount: goalAmount,
    p_account_amount: accountAmount,
    p_note: note ?? null,
  });
  if (error) throw error;
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

export async function insertFixedDueNotification(title: string, body: string): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const { count } = await sb.from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('type', 'fixed_due').eq('title', title)
    .gte('created_at', todayStart.toISOString());
  if ((count ?? 0) > 0) return;
  await sb.from('notifications').insert({ user_id: user.id, type: 'fixed_due', title, body, is_read: false });
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
  oldDate?: string;
}): Promise<void> {
  const sb = createClient();

  // Fix #3: if pre-read fails, throw rather than silently skipping old-balance reversal
  const { data: currentTx } = await sb.from('transactions').select('is_fixed, status, date, type, amount').eq('id', id).single();
  if (!currentTx) throw new Error('Transaction not found');
  const wasApplied = !currentTx.is_fixed && currentTx.status === 'confirmed';

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

  const oldWasApplied = wasApplied;
  const newIsFixed = data.is_fixed !== undefined ? data.is_fixed : (currentTx?.is_fixed ?? false);
  const newDate = data.date ?? currentTx?.date ?? '';
  const newWasApplied = !newIsFixed && isDatePastOrToday(newDate);

  // Update status field in the updates object
  if (!newIsFixed) {
    updates.status = isDatePastOrToday(newDate) ? 'confirmed' : 'pending';
  } else {
    updates.status = 'pending';
  }

  const { error } = await sb.from('transactions').update(updates).eq('id', id);
  if (error) throw error;

  // Adjust account balance — handle account change by updating two accounts separately
  const oldEffect = oldWasApplied ? (data.oldType === 'income' ? (data.oldAmount ?? 0) : -(data.oldAmount ?? 0)) : 0;
  const newType = data.type ?? data.oldType ?? 'expense';
  const newAmount = data.amount ?? data.oldAmount ?? 0;
  const newEffect = newWasApplied ? (newType === 'income' ? newAmount : -newAmount) : 0;

  const oldAccId = data.oldAccountId;
  const newAccId = data.account_id ?? data.oldAccountId;
  const accountChanged = !!(data.account_id && data.oldAccountId && data.account_id !== data.oldAccountId);

  if (accountChanged) {
    // Reverse old effect on old account, apply new effect on new account independently
    if (oldEffect !== 0 && oldAccId) {
      const { data: oldAcc } = await sb.from('accounts').select('current_balance').eq('id', oldAccId).single();
      if (oldAcc) await sb.from('accounts').update({ current_balance: Number(oldAcc.current_balance) - oldEffect }).eq('id', oldAccId);
    }
    if (newEffect !== 0 && newAccId) {
      const { data: newAcc } = await sb.from('accounts').select('current_balance').eq('id', newAccId).single();
      if (newAcc) await sb.from('accounts').update({ current_balance: Number(newAcc.current_balance) + newEffect }).eq('id', newAccId);
    }
  } else {
    // Same account: net delta
    const delta = newEffect - oldEffect;
    if (delta !== 0 && newAccId) {
      const { data: acc } = await sb.from('accounts').select('current_balance').eq('id', newAccId).single();
      if (acc) await sb.from('accounts').update({ current_balance: Number(acc.current_balance) + delta }).eq('id', newAccId);
    }
  }
}

export async function deleteTransaction(id: string, type: 'income' | 'expense', amount: number, accountId: string): Promise<void> {
  const sb = createClient();
  // Fix #4: throw if pre-read fails so we never silently skip balance reversal
  const { data: existing } = await sb.from('transactions').select('is_fixed, status').eq('id', id).single();
  if (!existing) throw new Error('Transaction not found');
  const { error } = await sb.from('transactions').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  // Only revert balance if it was confirmed AND not a fixed template
  if (existing.status === 'confirmed' && !existing.is_fixed) {
    const delta = type === 'income' ? -amount : amount;
    const { data: acc } = await sb.from('accounts').select('current_balance').eq('id', accountId).single();
    if (acc) {
      await sb.from('accounts').update({ current_balance: Number(acc.current_balance) + delta }).eq('id', accountId);
    }
  }
  // Fix #4: remove period-confirmation records when a fixed template is deleted
  if (existing.is_fixed) {
    await sb.from('fixed_confirmations').delete().eq('template_id', id);
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
  const { error } = await sb.rpc('cancel_savings_goal', { p_goal_id: id });
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
