# CoinDev — Documentación de Base de Datos

**Motor:** PostgreSQL 17 (Supabase `lejxqydqgakehbauptal`, región us-east-2)  
**Seguridad:** Row Level Security (RLS) activo en todas las tablas de usuario  
**Auth:** Supabase Auth (`auth.users`) — la tabla `profiles` extiende el usuario

---

## Diagrama de Relaciones

```
auth.users (Supabase)
    │
    └─── profiles (1:1)
              │
              ├─── accounts ──────────────── transactions
              │         │                        │
              │         └──────────────── goal_contributions
              │
              ├─── categories ────────────── transactions
              │         │                        │
              │         └────────────────── budgets
              │                                  │
              │                             fixed_expenses
              │
              ├─── savings_goals ──── goal_contributions
              │
              ├─── budgets
              ├─── fixed_expenses
              ├─── notifications
              └─── exchange_rates (compartida, sin user_id)
```

---

## Tipos Enumerados (ENUMs)

```sql
-- Tipos de cuenta
CREATE TYPE account_type AS ENUM (
  'checking',     -- Cuenta corriente / banco
  'savings',      -- Cuenta de ahorro
  'cash',         -- Efectivo
  'credit_card',  -- Tarjeta de crédito
  'investment',   -- Inversión
  'other'         -- Otro
);

-- Tipos de transacción
CREATE TYPE transaction_type AS ENUM (
  'income',    -- Ingreso
  'expense',   -- Gasto
  'transfer'   -- Transferencia entre cuentas
);

-- Tipos de categoría
CREATE TYPE category_type AS ENUM (
  'income',   -- Solo ingresos
  'expense',  -- Solo gastos
  'both'      -- Ambos (para transferencias)
);

-- Períodos de presupuesto
CREATE TYPE budget_period AS ENUM (
  'weekly',     -- Semanal
  'monthly',    -- Mensual (más común)
  'quarterly',  -- Trimestral
  'yearly'      -- Anual
);

-- Recurrencia
CREATE TYPE recurrence_type AS ENUM (
  'none',       -- No recurrente
  'daily',      -- Diario
  'weekly',     -- Semanal
  'biweekly',   -- Quincenal
  'monthly',    -- Mensual
  'quarterly',  -- Trimestral
  'yearly'      -- Anual
);

-- Estado de meta de ahorro
CREATE TYPE goal_status AS ENUM (
  'active',     -- En progreso
  'completed',  -- Alcanzada
  'paused',     -- Pausada temporalmente
  'cancelled'   -- Cancelada
);

-- Plan del usuario
CREATE TYPE plan_type AS ENUM (
  'free',  -- Plan gratuito
  'pro'    -- Plan premium
);

-- Tipos de notificación
CREATE TYPE notification_type AS ENUM (
  'fixed_due',       -- Gasto fijo próximo a vencer
  'budget_alert',    -- Presupuesto cerca del límite
  'goal_reached',    -- Meta de ahorro alcanzada
  'weekly_summary',  -- Resumen semanal
  'monthly_summary'  -- Resumen mensual
);
```

---

## Tablas

### `profiles`
Perfil del usuario. Complementa `auth.users` con preferencias de la app.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | uuid PK | — | UUID heredado de `auth.users` |
| `full_name` | text | NULL | Nombre completo |
| `avatar_url` | text | NULL | URL de avatar |
| `email` | text UNIQUE NOT NULL | — | Email del usuario |
| `default_currency` | char(3) | `'USD'` | ISO 4217 (USD, CRC, MXN…) |
| `timezone` | text | `'America/Costa_Rica'` | IANA timezone |
| `locale` | text | `'es-CR'` | BCP 47 para formateo |
| `plan` | plan_type | `'free'` | Plan activo |
| `plan_expires_at` | timestamptz | NULL | Expiración del plan Pro |
| `theme` | text | `'dark'` | Tema de la UI: dark / light |
| `language` | text | `'es'` | Idioma: es / en |
| `onboarding_done` | boolean | `false` | Onboarding completado |
| `created_at` | timestamptz | `now()` | — |
| `updated_at` | timestamptz | `now()` | — |
| `deleted_at` | timestamptz | NULL | Soft delete |

**Índices:** `profiles_email_key` (UNIQUE), `idx_profiles_email` (WHERE deleted_at IS NULL), `idx_profiles_plan`

---

### `categories`
Categorías de transacciones. Las del sistema (`is_system = TRUE`, `user_id = NULL`) son compartidas entre todos los usuarios y no son editables.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `user_id` | uuid FK → profiles | NULL | NULL = categoría del sistema |
| `name` | text NOT NULL | — | Nombre en español |
| `name_en` | text | NULL | Nombre en inglés |
| `type` | category_type | `'expense'` | income / expense / both |
| `icon` | text | `'📦'` | Emoji del ícono |
| `color` | char(7) | `'#6B7280'` | Color hex (#RRGGBB) |
| `parent_id` | uuid FK → categories | NULL | NULL = raíz; apunta a padre para subcategorías |
| `is_system` | boolean | `false` | TRUE = no editable por usuario |
| `sort_order` | smallint | `0` | Orden de visualización |
| `created_at` | timestamptz | `now()` | — |
| `updated_at` | timestamptz | `now()` | — |
| `deleted_at` | timestamptz | NULL | Soft delete |

**Índices:** `unique_category_per_user` (user_id, parent_id, name NULLS NOT DISTINCT), `idx_categories_system`, `idx_categories_type`, `idx_categories_user_id`, `idx_categories_parent`

#### Categorías del Sistema (19 registros)

**Ingresos**

| Slug frontend | UUID | Nombre ES | Nombre EN | Color |
|--------------|------|-----------|-----------|-------|
| `salary` | `6c782625-6722-43d5-91b3-b97343d96c40` | Salario | Salary | #10B981 |
| `freelance` | `fd9e3747-7e4b-4ca1-be28-e651a24abbff` | Freelance | Freelance | #3B82F6 |
| `investments` | `71e681aa-f271-43f9-9528-dc2e126f59a5` | Inversiones | Investments | #8B5CF6 |
| `bonuses` | `6fb5ba99-dab3-4a32-bf92-c5bddbcb3adf` | Bonos | Bonuses | #F59E0B |
| `other_income` | `cb5f3407-7bdd-4998-b384-1be8d63079fc` | Otros ingresos | Other income | #6EE7B7 |

**Gastos**

| Slug frontend | UUID | Nombre ES | Nombre EN | Color |
|--------------|------|-----------|-----------|-------|
| `rent` | `c30706ec-5bbc-4918-9dd6-2378785371da` | Vivienda | Housing | #EF4444 |
| `groceries` | `ad5f772f-99eb-437f-9cbf-5e73b763c4af` | Alimentación | Food | #F97316 |
| `transport` | `6880e3d5-6343-4dce-87d0-39dc1e45a706` | Transporte | Transport | #EAB308 |
| `health` | `1d18a93f-4e6d-4872-9bfb-f9bab1d5005b` | Salud | Health | #EC4899 |
| `education` | `0e75fd81-348d-4aab-a0a2-3b44b1f69ce9` | Educación | Education | #06B6D4 |
| `fun` | `6a997c6e-6c5d-480e-b2f4-3bca174c40d6` | Ocio | Entertainment | #A855F7 |
| `subs` | `7eb9598a-aed6-4314-98f2-9a8be1133369` | Suscripciones | Subscriptions | #64748B |
| `clothing` | `21614e3c-a003-41fd-8352-3b9289f85b84` | Ropa | Clothing | #F472B6 |
| `tech` | `e6fe52d4-2bb5-4436-b328-862028472b60` | Tecnología | Technology | #0EA5E9 |
| `utilities` | `13df4afe-312c-487d-84f6-71c89204637c` | Servicios | Utilities | #FCD34D |
| `credit_card` | `83a3850e-6214-43e3-9ae3-35d9d307c8fe` | Tarjeta crédito | Credit card | #DC2626 |
| `pets` | `b6a88898-29d9-4908-91df-faaa9bfd2f29` | Mascotas | Pets | #84CC16 |
| `travel` | `f6ff4b8a-169e-45d8-877b-6a434949fccd` | Viajes | Travel | #0D9488 |
| `other` | `bd686c70-e04d-4c4a-8e71-c1bebb4a2e4b` | Otros gastos | Other expenses | #9CA3AF |

> **Nota:** El campo `notes` de `transactions` almacena el slug frontend como fallback cuando `category_id` no resuelve a un slug conocido. El mapeo slug ↔ UUID vive en `src/lib/db.ts`.

---

### `accounts`
Cuentas financieras del usuario (banco, efectivo, ahorro, tarjeta de crédito).

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `user_id` | uuid FK → profiles NOT NULL | — | Propietario |
| `name` | text NOT NULL | — | Nombre descriptivo |
| `type` | account_type | `'checking'` | Tipo de cuenta |
| `initial_balance` | numeric | `0.00` | Saldo al crear la cuenta |
| `current_balance` | numeric | `0.00` | Saldo actual (actualizado por transacciones) |
| `currency` | char(3) | `'USD'` | Moneda de la cuenta |
| `credit_limit` | numeric | NULL | Solo tarjetas de crédito |
| `payment_due_day` | smallint | NULL | Día de corte (tarjetas) |
| `interest_rate` | numeric | NULL | Tasa de interés anual % (tarjetas) |
| `color` | char(7) | `'#6EE7B7'` | Color de la tarjeta en UI |
| `icon` | text | `'wallet'` | Ícono de la cuenta |
| `last_digits` | varchar(4) | NULL | Últimos 4 dígitos (tarjetas) |
| `is_active` | boolean | `true` | FALSE = eliminada (soft delete) |
| `include_in_net` | boolean | `true` | Si se incluye en el balance neto |
| `created_at` | timestamptz | `now()` | — |
| `updated_at` | timestamptz | `now()` | — |
| `deleted_at` | timestamptz | NULL | Soft delete |

**Índices:** `idx_accounts_user_id` (WHERE deleted_at IS NULL), `idx_accounts_type`

**Mapeo frontend → DB (account type):**
```
bank    → checking
savings → savings
cash    → cash
credit  → credit_card
```

---

### `transactions`
Registro de todos los movimientos financieros (ingresos, gastos, transferencias).

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `user_id` | uuid FK → profiles NOT NULL | — | Propietario |
| `account_id` | uuid FK → accounts NOT NULL | — | Cuenta de origen |
| `category_id` | uuid FK → categories | NULL | Categoría |
| `to_account_id` | uuid FK → accounts | NULL | Cuenta destino (transferencias) |
| `type` | transaction_type NOT NULL | — | income / expense / transfer |
| `amount` | numeric NOT NULL | — | Monto siempre positivo |
| `currency` | char(3) | `'USD'` | Moneda de la transacción |
| `exchange_rate` | numeric | `1.000000` | Tipo de cambio al registrar |
| `amount_base` | numeric | — | `amount × exchange_rate` (columna generada) |
| `description` | text NOT NULL | — | Descripción del movimiento |
| `notes` | text | NULL | Notas adicionales / slug de categoría (fallback) |
| `date` | date | `CURRENT_DATE` | Fecha del movimiento (sin hora) |
| `is_fixed` | boolean | `false` | Es gasto/ingreso recurrente |
| `recurrence` | recurrence_type | `'none'` | Frecuencia de recurrencia |
| `recurrence_end` | date | NULL | Fin de la recurrencia |
| `parent_tx_id` | uuid FK → transactions | NULL | Padre si fue generado automáticamente |
| `status` | text | `'confirmed'` | pending / confirmed / cancelled |
| `attachment_url` | text | NULL | URL de comprobante adjunto |
| `created_at` | timestamptz | `now()` | — |
| `updated_at` | timestamptz | `now()` | — |
| `deleted_at` | timestamptz | NULL | Soft delete |

**Índices:** `idx_transactions_user_date` (user_id, date DESC WHERE deleted_at IS NULL), `idx_transactions_user_id`, `idx_transactions_date`, `idx_transactions_account`, `idx_transactions_category`, `idx_transactions_type`, `idx_transactions_is_fixed`

**Regla de balance:** Al insertar/eliminar una transacción, `accounts.current_balance` se ajusta:
- `income` → `+amount`
- `expense` → `-amount`
- `transfer` → `-amount` en origen, `+amount` en destino

---

### `budgets`
Límites de gasto mensual por categoría.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `user_id` | uuid FK → profiles NOT NULL | — | Propietario |
| `category_id` | uuid FK → categories NOT NULL | — | Categoría del presupuesto |
| `limit_amount` | numeric NOT NULL | — | Límite de gasto |
| `currency` | char(3) | `'USD'` | Moneda |
| `period` | budget_period | `'monthly'` | Periodicidad |
| `month` | smallint | NULL | 1–12; NULL = presupuesto recurrente |
| `year` | smallint | NULL | Año; NULL = presupuesto recurrente |
| `is_active` | boolean | `true` | FALSE = eliminado (soft delete) |
| `alert_at_pct` | smallint | `80` | % del límite que dispara alerta |
| `created_at` | timestamptz | `now()` | — |
| `updated_at` | timestamptz | `now()` | — |

**Índices:** `unique_budget` (user_id, category_id, period, month, year — UNIQUE), `idx_budgets_user_id`, `idx_budgets_category`

> El campo `spent` no se almacena — se calcula en tiempo real filtrando `transactions` del mes en curso para la categoría correspondiente.

---

### `savings_goals`
Metas de ahorro del usuario.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `user_id` | uuid FK → profiles NOT NULL | — | Propietario |
| `account_id` | uuid FK → accounts | NULL | Cuenta asociada (opcional) |
| `name` | text NOT NULL | — | Nombre de la meta |
| `description` | text | NULL | Descripción |
| `icon` | text | `'🎯'` | Slug del ícono (target, home, car…) |
| `target_amount` | numeric NOT NULL | — | Monto objetivo |
| `current_amount` | numeric | `0.00` | Monto acumulado hacia la meta |
| `currency` | char(3) | `'USD'` | Moneda |
| `target_date` | date | NULL | Fecha límite (NULL = sin fecha) |
| `status` | goal_status | `'active'` | active / paused / completed / cancelled |
| `created_at` | timestamptz | `now()` | — |
| `updated_at` | timestamptz | `now()` | — |
| `deleted_at` | timestamptz | NULL | Soft delete |

**Índices:** `idx_goals_user_id` (WHERE deleted_at IS NULL), `idx_goals_status`

---

### `goal_contributions`
Historial de aportes a metas de ahorro. Cada registro descuenta de la cuenta de origen y suma a `savings_goals.current_amount`.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `goal_id` | uuid FK → savings_goals NOT NULL | — | Meta que recibe el aporte |
| `account_id` | uuid FK → accounts NOT NULL | — | Cuenta de la que sale el dinero |
| `amount` | numeric(15,2) NOT NULL CHECK > 0 | — | Monto del aporte |
| `note` | text | NULL | Nota del aporte (ej: "Quincena mayo") |
| `created_at` | timestamptz | `now()` | Fecha del aporte |

**Índices:** `idx_goal_contributions_goal_id`, `idx_goal_contributions_created_at`

**Efecto al insertar:**
1. `savings_goals.current_amount += amount`
2. `accounts.current_balance -= amount`

---

### `fixed_expenses`
Gastos recurrentes fijos (alquiler, suscripciones, servicios).

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `user_id` | uuid FK → profiles NOT NULL | — | Propietario |
| `account_id` | uuid FK → accounts NOT NULL | — | Cuenta de pago |
| `category_id` | uuid FK → categories | NULL | Categoría |
| `name` | text NOT NULL | — | Nombre del gasto |
| `amount` | numeric NOT NULL | — | Monto mensual |
| `currency` | char(3) | `'USD'` | Moneda |
| `type` | transaction_type | `'expense'` | Siempre expense |
| `recurrence` | recurrence_type | `'monthly'` | Frecuencia |
| `day_of_month` | smallint | NULL | Día del mes (1–31) para recurrencia mensual |
| `day_of_week` | smallint | NULL | Día semana (0=Dom…6=Sáb) para semanal |
| `next_due_date` | date NOT NULL | — | Próximo vencimiento |
| `last_paid_date` | date | NULL | Último pago registrado |
| `is_credit_card` | boolean | `false` | Si se carga a tarjeta |
| `is_active` | boolean | `true` | FALSE = eliminado |
| `notes` | text | NULL | Notas adicionales |
| `created_at` | timestamptz | `now()` | — |
| `updated_at` | timestamptz | `now()` | — |
| `deleted_at` | timestamptz | NULL | Soft delete |

**Índices:** `idx_fixed_expenses_user_id` (WHERE deleted_at IS NULL), `idx_fixed_expenses_due` (WHERE is_active = true)

---

### `notifications`
Notificaciones in-app del sistema.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `user_id` | uuid FK → profiles NOT NULL | — | Destinatario |
| `type` | notification_type NOT NULL | — | Tipo de notificación |
| `title` | text NOT NULL | — | Título |
| `body` | text NOT NULL | — | Cuerpo del mensaje |
| `ref_table` | text | NULL | Tabla del objeto relacionado (polimórfico) |
| `ref_id` | uuid | NULL | ID del objeto en ref_table |
| `is_read` | boolean | `false` | Leída o no |
| `read_at` | timestamptz | NULL | Cuándo se marcó como leída |
| `created_at` | timestamptz | `now()` | — |

**Índices:** `idx_notifications_user` (user_id, created_at DESC), `idx_notifications_unread` (user_id WHERE is_read = false)

---

### `exchange_rates`
Caché de tipos de cambio obtenidos de la Currency API. No tiene `user_id` — es compartida.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | uuid PK | `gen_random_uuid()` | — |
| `base_currency` | char(3) | `'USD'` | Moneda base |
| `currency` | char(3) NOT NULL | — | Moneda destino |
| `rate` | numeric NOT NULL | — | Unidades de `currency` por 1 `base_currency` |
| `source` | text | `'exchangerate-api'` | API de origen |
| `fetched_at` | timestamptz | `now()` | Timestamp exacto de la consulta |
| `fetched_hour` | timestamp | NULL | Hora truncada (para deduplicar por hora) |

**Índices:** `unique_rate_per_hour` (base_currency, currency, fetched_hour — UNIQUE), `idx_exchange_rates_pair` (base_currency, currency, fetched_at DESC)

---

## Row Level Security (RLS)

Todas las tablas con datos de usuario tienen RLS habilitado. La política general es:

```sql
-- Patrón usado en accounts, transactions, budgets, savings_goals, fixed_expenses, notifications
USING (auth.uid() = user_id)
```

Para `categories`:
```sql
-- El usuario ve sus propias categorías + las del sistema
USING (user_id = auth.uid() OR user_id IS NULL)
```

Para `goal_contributions`:
```sql
-- El usuario accede a aportes de sus propias metas
USING (goal_id IN (SELECT id FROM savings_goals WHERE user_id = auth.uid()))
```

Para `exchange_rates`:
```sql
-- Lectura pública, escritura solo desde service role
SELECT FOR ALL USING (true)
```

---

## Flujos de Datos Críticos

### Crear transacción
1. INSERT en `transactions`
2. UPDATE `accounts.current_balance` según tipo y monto
3. Si `is_fixed = true`, se puede vincular a un registro en `fixed_expenses`

### Eliminar transacción (soft delete)
1. UPDATE `transactions.deleted_at = now()`
2. Revertir el efecto en `accounts.current_balance`

### Agregar aporte a meta
1. INSERT en `goal_contributions`
2. UPDATE `savings_goals.current_amount += amount`
3. UPDATE `accounts.current_balance -= amount`

### Eliminar meta (soft delete)
1. UPDATE `savings_goals.status = 'cancelled'`
2. UPDATE `savings_goals.deleted_at = now()`
3. Los aportes (`goal_contributions`) se conservan por historial (CASCADE no los elimina porque no hay soft delete en goal_contributions)

---

## Script de Respaldo

Ver [`backup.sql`](backup.sql) para el DDL completo con datos iniciales del sistema.
