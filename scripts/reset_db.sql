-- ============================================================
-- CoinDev — Script de limpieza total de base de datos
--
-- Elimina TODOS los datos de usuario.
-- Conserva únicamente la cuenta stevengalocr@gmail.com
-- con contraseña "123" y las categorías del sistema.
--
-- IMPORTANTE: Ejecutar en Supabase SQL Editor con rol
-- service_role (o desde el panel de Supabase directamente).
-- ============================================================

-- 1. Desactivar triggers temporalmente para evitar cascadas
--    inesperadas al borrar en orden
SET session_replication_role = replica;

-- 2. Borrar datos de usuario en orden correcto (dependencias FK)
DELETE FROM public.goal_contributions;
DELETE FROM public.savings_goals;
DELETE FROM public.transactions;
DELETE FROM public.fixed_expenses;
DELETE FROM public.budgets;
DELETE FROM public.notifications;
DELETE FROM public.feedback;

-- 3. Borrar cuentas de TODOS los usuarios
DELETE FROM public.accounts;

-- 4. Borrar categorías personalizadas (conservar las del sistema)
DELETE FROM public.categories WHERE is_system = false;

-- 5. Borrar perfiles excepto el admin
DELETE FROM public.profiles
WHERE email != 'stevengalocr@gmail.com';

-- 6. Borrar usuarios de auth excepto el admin
DELETE FROM auth.users
WHERE email != 'stevengalocr@gmail.com';

-- 7. Reactivar triggers
SET session_replication_role = DEFAULT;

-- 8. Actualizar contraseña del admin a "123"
UPDATE auth.users
SET
  encrypted_password = crypt('123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'stevengalocr@gmail.com';

-- 9. Limpiar tokens de sesión activos del admin
--    (forzar re-login con la nueva contraseña)
DELETE FROM auth.sessions
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'stevengalocr@gmail.com'
);
DELETE FROM auth.refresh_tokens
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'stevengalocr@gmail.com'
);

-- 10. Verificación final
SELECT
  (SELECT COUNT(*) FROM auth.users)                          AS total_auth_users,
  (SELECT COUNT(*) FROM public.profiles)                     AS total_profiles,
  (SELECT COUNT(*) FROM public.accounts)                     AS total_accounts,
  (SELECT COUNT(*) FROM public.transactions)                 AS total_transactions,
  (SELECT COUNT(*) FROM public.budgets)                      AS total_budgets,
  (SELECT COUNT(*) FROM public.savings_goals)                AS total_goals,
  (SELECT COUNT(*) FROM public.goal_contributions)           AS total_contributions,
  (SELECT COUNT(*) FROM public.fixed_expenses)               AS total_fixed_expenses,
  (SELECT COUNT(*) FROM public.notifications)                AS total_notifications,
  (SELECT COUNT(*) FROM public.feedback)                     AS total_feedback,
  (SELECT COUNT(*) FROM public.categories WHERE is_system = true) AS system_categories;

-- Resultado esperado:
-- total_auth_users = 1
-- total_profiles   = 1
-- todo lo demás    = 0
-- system_categories = 19
