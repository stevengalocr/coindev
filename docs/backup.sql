-- =============================================================
-- COINDEV — Script de Respaldo y Restauración
-- Base de datos: PostgreSQL 17 (Supabase)
-- Proyecto: lejxqydqgakehbauptal | Región: us-east-2
-- Generado: 2026-05-20
-- =============================================================
-- USO: Ejecutar en orden. Requiere extensión pgcrypto (disponible en Supabase por defecto).
-- ADVERTENCIA: Requiere haber creado el proyecto en Supabase previamente.
--              El schema auth.users lo gestiona Supabase Auth automáticamente.
-- =============================================================


-- ============================================================
-- 1. TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE public.account_type AS ENUM (
  'checking',
  'savings',
  'cash',
  'credit_card',
  'investment',
  'other'
);

CREATE TYPE public.transaction_type AS ENUM (
  'income',
  'expense',
  'transfer'
);

CREATE TYPE public.category_type AS ENUM (
  'income',
  'expense',
  'both'
);

CREATE TYPE public.budget_period AS ENUM (
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
);

CREATE TYPE public.recurrence_type AS ENUM (
  'none',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly'
);

CREATE TYPE public.goal_status AS ENUM (
  'active',
  'completed',
  'paused',
  'cancelled'
);

CREATE TYPE public.plan_type AS ENUM (
  'free',
  'pro'
);

CREATE TYPE public.notification_type AS ENUM (
  'fixed_due',
  'budget_alert',
  'goal_reached',
  'weekly_summary',
  'monthly_summary'
);


-- ============================================================
-- 2. TABLA: profiles
-- ============================================================

CREATE TABLE public.profiles (
  id                uuid        PRIMARY KEY,  -- Heredado de auth.users
  full_name         text,
  avatar_url        text,
  email             text        NOT NULL UNIQUE,
  default_currency  char(3)     NOT NULL DEFAULT 'USD',
  timezone          text        NOT NULL DEFAULT 'America/Costa_Rica',
  locale            text        NOT NULL DEFAULT 'es-CR',
  plan              plan_type   NOT NULL DEFAULT 'free',
  plan_expires_at   timestamptz,
  theme             text        NOT NULL DEFAULT 'dark',
  language          text        NOT NULL DEFAULT 'es',
  onboarding_done   boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);

-- Índices
CREATE INDEX idx_profiles_email ON public.profiles (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_plan  ON public.profiles (plan);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 3. TABLA: categories
-- ============================================================

CREATE TABLE public.categories (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text          NOT NULL,
  name_en     text,
  type        category_type NOT NULL DEFAULT 'expense',
  icon        text          NOT NULL DEFAULT '📦',
  color       char(7)       NOT NULL DEFAULT '#6B7280',
  parent_id   uuid          REFERENCES public.categories(id) ON DELETE SET NULL,
  is_system   boolean       NOT NULL DEFAULT false,
  sort_order  smallint      NOT NULL DEFAULT 0,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

-- Índices
CREATE UNIQUE INDEX unique_category_per_user
  ON public.categories (user_id, parent_id, name) NULLS NOT DISTINCT;
CREATE INDEX idx_categories_user_id  ON public.categories (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_system   ON public.categories (is_system) WHERE is_system = true;
CREATE INDEX idx_categories_type     ON public.categories (type);
CREATE INDEX idx_categories_parent   ON public.categories (parent_id);

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own + system categories"
  ON public.categories FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL);


-- ============================================================
-- 4. TABLA: accounts
-- ============================================================

CREATE TABLE public.accounts (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             text         NOT NULL,
  type             account_type NOT NULL DEFAULT 'checking',
  initial_balance  numeric      NOT NULL DEFAULT 0.00,
  current_balance  numeric      NOT NULL DEFAULT 0.00,
  currency         char(3)      NOT NULL DEFAULT 'USD',
  credit_limit     numeric,
  payment_due_day  smallint,
  interest_rate    numeric,
  color            char(7)      NOT NULL DEFAULT '#6EE7B7',
  icon             text         NOT NULL DEFAULT 'wallet',
  last_digits      varchar(4),
  is_active        boolean      NOT NULL DEFAULT true,
  include_in_net   boolean      NOT NULL DEFAULT true,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

-- Índices
CREATE INDEX idx_accounts_user_id ON public.accounts (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_type    ON public.accounts (type);

-- RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own accounts"
  ON public.accounts FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- 5. TABLA: transactions
-- ============================================================

CREATE TABLE public.transactions (
  id              uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid             NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id      uuid             NOT NULL REFERENCES public.accounts(id),
  category_id     uuid             REFERENCES public.categories(id),
  to_account_id   uuid             REFERENCES public.accounts(id),
  type            transaction_type NOT NULL,
  amount          numeric          NOT NULL CHECK (amount > 0),
  currency        char(3)          NOT NULL DEFAULT 'USD',
  exchange_rate   numeric          NOT NULL DEFAULT 1.000000,
  amount_base     numeric          GENERATED ALWAYS AS (amount * exchange_rate) STORED,
  description     text             NOT NULL,
  notes           text,
  date            date             NOT NULL DEFAULT CURRENT_DATE,
  is_fixed        boolean          NOT NULL DEFAULT false,
  recurrence      recurrence_type  NOT NULL DEFAULT 'none',
  recurrence_end  date,
  parent_tx_id    uuid             REFERENCES public.transactions(id),
  status          text             NOT NULL DEFAULT 'confirmed',
  attachment_url  text,
  created_at      timestamptz      NOT NULL DEFAULT now(),
  updated_at      timestamptz      NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

-- Índices
CREATE INDEX idx_transactions_user_id   ON public.transactions (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_date ON public.transactions (user_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_account   ON public.transactions (account_id);
CREATE INDEX idx_transactions_category  ON public.transactions (category_id);
CREATE INDEX idx_transactions_date      ON public.transactions (date DESC);
CREATE INDEX idx_transactions_type      ON public.transactions (type);
CREATE INDEX idx_transactions_is_fixed  ON public.transactions (is_fixed) WHERE is_fixed = true;

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- 6. TABLA: budgets
-- ============================================================

CREATE TABLE public.budgets (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id   uuid          NOT NULL REFERENCES public.categories(id),
  limit_amount  numeric       NOT NULL CHECK (limit_amount > 0),
  currency      char(3)       NOT NULL DEFAULT 'USD',
  period        budget_period NOT NULL DEFAULT 'monthly',
  month         smallint      CHECK (month BETWEEN 1 AND 12),
  year          smallint,
  is_active     boolean       NOT NULL DEFAULT true,
  alert_at_pct  smallint      NOT NULL DEFAULT 80,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

-- Índices
CREATE UNIQUE INDEX unique_budget
  ON public.budgets (user_id, category_id, period, month, year);
CREATE INDEX idx_budgets_user_id  ON public.budgets (user_id);
CREATE INDEX idx_budgets_category ON public.budgets (category_id);

-- RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- 7. TABLA: savings_goals
-- ============================================================

CREATE TABLE public.savings_goals (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id      uuid        REFERENCES public.accounts(id),
  name            text        NOT NULL,
  description     text,
  icon            text        NOT NULL DEFAULT '🎯',
  target_amount   numeric     NOT NULL CHECK (target_amount > 0),
  current_amount  numeric     NOT NULL DEFAULT 0.00,
  currency        char(3)     NOT NULL DEFAULT 'USD',
  target_date     date,
  status          goal_status NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

-- Índices
CREATE INDEX idx_goals_user_id ON public.savings_goals (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_goals_status  ON public.savings_goals (status);

-- RLS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals"
  ON public.savings_goals FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- 8. TABLA: goal_contributions
-- ============================================================

CREATE TABLE public.goal_contributions (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id     uuid         NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  account_id  uuid         NOT NULL REFERENCES public.accounts(id),
  amount      numeric(15,2) NOT NULL CHECK (amount > 0),
  note        text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_goal_contributions_goal_id    ON public.goal_contributions (goal_id);
CREATE INDEX idx_goal_contributions_created_at ON public.goal_contributions (created_at DESC);

-- RLS
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own contributions"
  ON public.goal_contributions FOR ALL
  USING (
    goal_id IN (
      SELECT id FROM public.savings_goals WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 9. TABLA: fixed_expenses
-- ============================================================

CREATE TABLE public.fixed_expenses (
  id              uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid             NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id      uuid             NOT NULL REFERENCES public.accounts(id),
  category_id     uuid             REFERENCES public.categories(id),
  name            text             NOT NULL,
  amount          numeric          NOT NULL CHECK (amount > 0),
  currency        char(3)          NOT NULL DEFAULT 'USD',
  type            transaction_type NOT NULL DEFAULT 'expense',
  recurrence      recurrence_type  NOT NULL DEFAULT 'monthly',
  day_of_month    smallint         CHECK (day_of_month BETWEEN 1 AND 31),
  day_of_week     smallint         CHECK (day_of_week BETWEEN 0 AND 6),
  next_due_date   date             NOT NULL,
  last_paid_date  date,
  is_credit_card  boolean          NOT NULL DEFAULT false,
  is_active       boolean          NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz      NOT NULL DEFAULT now(),
  updated_at      timestamptz      NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

-- Índices
CREATE INDEX idx_fixed_expenses_user_id ON public.fixed_expenses (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_fixed_expenses_due     ON public.fixed_expenses (next_due_date) WHERE is_active = true;

-- RLS
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fixed expenses"
  ON public.fixed_expenses FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- 10. TABLA: notifications
-- ============================================================

CREATE TABLE public.notifications (
  id         uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      text              NOT NULL,
  body       text              NOT NULL,
  ref_table  text,
  ref_id     uuid,
  is_read    boolean           NOT NULL DEFAULT false,
  read_at    timestamptz,
  created_at timestamptz       NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_notifications_user   ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications (user_id) WHERE is_read = false;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- 11. TABLA: exchange_rates
-- ============================================================

CREATE TABLE public.exchange_rates (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency  char(3)     NOT NULL DEFAULT 'USD',
  currency       char(3)     NOT NULL,
  rate           numeric     NOT NULL CHECK (rate > 0),
  source         text        NOT NULL DEFAULT 'exchangerate-api',
  fetched_at     timestamptz NOT NULL DEFAULT now(),
  fetched_hour   timestamp
);

-- Índices
CREATE UNIQUE INDEX unique_rate_per_hour
  ON public.exchange_rates (base_currency, currency, fetched_hour);
CREATE INDEX idx_exchange_rates_pair
  ON public.exchange_rates (base_currency, currency, fetched_at DESC);

-- RLS (lectura pública, escritura solo service role)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read exchange rates"
  ON public.exchange_rates FOR SELECT
  USING (true);


-- ============================================================
-- 12. DATOS INICIALES: categorías del sistema
-- ============================================================

INSERT INTO public.categories (id, user_id, name, name_en, type, icon, color, is_system, sort_order)
VALUES
  -- INGRESOS
  ('6c782625-6722-43d5-91b3-b97343d96c40', NULL, 'Salario',        'Salary',          'income',  '💼', '#10B981', TRUE,  1),
  ('fd9e3747-7e4b-4ca1-be28-e651a24abbff', NULL, 'Freelance',      'Freelance',       'income',  '💻', '#3B82F6', TRUE,  2),
  ('71e681aa-f271-43f9-9528-dc2e126f59a5', NULL, 'Inversiones',    'Investments',     'income',  '📈', '#8B5CF6', TRUE,  3),
  ('6fb5ba99-dab3-4a32-bf92-c5bddbcb3adf', NULL, 'Bonos',          'Bonuses',         'income',  '🎁', '#F59E0B', TRUE,  4),
  ('cb5f3407-7bdd-4998-b384-1be8d63079fc', NULL, 'Otros ingresos', 'Other income',    'income',  '➕', '#6EE7B7', TRUE,  5),
  -- GASTOS
  ('c30706ec-5bbc-4918-9dd6-2378785371da', NULL, 'Vivienda',       'Housing',         'expense', '🏠', '#EF4444', TRUE, 10),
  ('ad5f772f-99eb-437f-9cbf-5e73b763c4af', NULL, 'Alimentación',   'Food',            'expense', '🍽️', '#F97316', TRUE, 11),
  ('6880e3d5-6343-4dce-87d0-39dc1e45a706', NULL, 'Transporte',     'Transport',       'expense', '🚗', '#EAB308', TRUE, 12),
  ('1d18a93f-4e6d-4872-9bfb-f9bab1d5005b', NULL, 'Salud',          'Health',          'expense', '❤️', '#EC4899', TRUE, 13),
  ('0e75fd81-348d-4aab-a0a2-3b44b1f69ce9', NULL, 'Educación',      'Education',       'expense', '📚', '#06B6D4', TRUE, 14),
  ('6a997c6e-6c5d-480e-b2f4-3bca174c40d6', NULL, 'Ocio',           'Entertainment',   'expense', '🎬', '#A855F7', TRUE, 15),
  ('7eb9598a-aed6-4314-98f2-9a8be1133369', NULL, 'Suscripciones',  'Subscriptions',   'expense', '🔄', '#64748B', TRUE, 16),
  ('21614e3c-a003-41fd-8352-3b9289f85b84', NULL, 'Ropa',           'Clothing',        'expense', '👗', '#F472B6', TRUE, 17),
  ('e6fe52d4-2bb5-4436-b328-862028472b60', NULL, 'Tecnología',     'Technology',      'expense', '📱', '#0EA5E9', TRUE, 18),
  ('13df4afe-312c-487d-84f6-71c89204637c', NULL, 'Servicios',      'Utilities',       'expense', '⚡', '#FCD34D', TRUE, 19),
  ('83a3850e-6214-43e3-9ae3-35d9d307c8fe', NULL, 'Tarjeta crédito','Credit card',     'expense', '💳', '#DC2626', TRUE, 20),
  ('b6a88898-29d9-4908-91df-faaa9bfd2f29', NULL, 'Mascotas',       'Pets',            'expense', '🐾', '#84CC16', TRUE, 21),
  ('f6ff4b8a-169e-45d8-877b-6a434949fccd', NULL, 'Viajes',         'Travel',          'expense', '✈️', '#0D9488', TRUE, 22),
  ('bd686c70-e04d-4c4a-8e71-c1bebb4a2e4b', NULL, 'Otros gastos',   'Other expenses',  'expense', '➖', '#9CA3AF', TRUE, 23);


-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
-- Verificación rápida post-restauración:
--
--   SELECT COUNT(*) FROM public.categories WHERE is_system = TRUE;
--   -- Esperado: 19
--
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
--   ORDER BY table_name;
--   -- Esperado: accounts, budgets, categories, exchange_rates,
--   --           fixed_expenses, goal_contributions, notifications,
--   --           profiles, savings_goals, transactions
-- ============================================================
