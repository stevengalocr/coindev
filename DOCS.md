# CoinDev — Documentación completa del sistema

> Finanzas personales para Costa Rica y LATAM. Multi-moneda, multi-dispositivo, con integridad de datos garantizada por transacciones atómicas en PostgreSQL.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Autenticación y sesión](#2-autenticación-y-sesión)
3. [Módulo: Cuentas](#3-módulo-cuentas)
4. [Módulo: Movimientos](#4-módulo-movimientos)
5. [Módulo: Gastos fijos](#5-módulo-gastos-fijos)
6. [Módulo: Compromisos de hoy (DueTodayCard)](#6-módulo-compromisos-de-hoy-duetodaycard)
7. [Módulo: Presupuestos](#7-módulo-presupuestos)
8. [Módulo: Metas de ahorro](#8-módulo-metas-de-ahorro)
9. [Módulo: Reportes](#9-módulo-reportes)
10. [Módulo: Divisas](#10-módulo-divisas)
11. [Módulo: Perfil](#11-módulo-perfil)
12. [Módulo: Notificaciones](#12-módulo-notificaciones)
13. [Módulo: Dashboard principal](#13-módulo-dashboard-principal)
14. [Capa de datos (db.ts y useData)](#14-capa-de-datos-dbts-y-usedata)
15. [Integridad de datos y RPCs atómicos](#15-integridad-de-datos-y-rpcs-atómicos)
16. [Multi-moneda](#16-multi-moneda)
17. [Plan de membresía](#17-plan-de-membresía)

---

## 1. Arquitectura general

```
Next.js App Router (client components)
        │
        ▼
useData (DataProvider)          ← único punto de verdad para todos los módulos
        │
        ▼
lib/db.ts                       ← todas las llamadas a Supabase
        │
        ▼
Supabase (PostgreSQL + Auth + Storage)
```

**Stack:**
- **Frontend:** Next.js App Router, React, TypeScript
- **Base de datos:** Supabase (PostgreSQL con RLS)
- **Auth:** Supabase Auth (email + password)
- **Storage:** Supabase Storage (avatares)
- **Tipo de cambio:** Currency API vía `/api/fx`

**Principio fundamental de arquitectura:**
Los gastos fijos (`is_fixed = true`) son **plantillas puras** — nunca afectan el balance de una cuenta directamente. El balance solo cambia cuando existe una transacción **confirmada** y **no-fija**.

---

## 2. Autenticación y sesión

### Flujo de registro
1. Usuario ingresa nombre, correo y contraseña
2. Supabase crea el usuario y el perfil vía trigger de DB
3. Se redirige automáticamente al dashboard

### Flujo de login
- Validación con `signInWithPassword`
- Si `plan_status === 'blocked'` → se hace signOut y se muestra mensaje de suspensión
- Auto-redirect: usa `getUser()` (validación server-side) — no `getSession()` — para evitar leer JWTs expirados del caché del navegador

### Mantenimiento de sesión
- `onAuthStateChange` en `useData`:
  - `SIGNED_OUT` → limpia todo el estado y redirige a `/login`
  - `TOKEN_REFRESHED` → recarga todos los datos
- Si `getUser()` retorna null (sesión expirada) → redirige a `/login` inmediatamente

---

## 3. Módulo: Cuentas

**Ruta:** `/dashboard/cuentas`

### Tipos de cuenta
| Tipo | Descripción |
|------|-------------|
| `savings` | Cuenta de ahorros |
| `checking` | Cuenta corriente |
| `cash` | Efectivo |
| `investment` | Inversión |
| `credit` | Tarjeta de crédito |

### Monedas soportadas por cuenta
Cada cuenta tiene su propia moneda (`CRC` o `USD`). Todos los balances se muestran en la moneda nativa de la cuenta.

### Funciones disponibles
- **Crear cuenta** — nombre, tipo, color, moneda, saldo inicial, límite de crédito (opcional), últimos dígitos (opcional)
- **Editar cuenta** — todos los campos excepto el saldo (el saldo solo cambia via transacciones)
- **Eliminar cuenta** — soft delete (`deleted_at`). Las transacciones asociadas permanecen como historial
- **Ordenar** — por mayor/menor saldo (convertido a CRC para comparación correcta), nombre, tipo

### Control de integridad
- El saldo no se edita manualmente — solo cambia via transacciones atómicas
- El sort de balance convierte USD a CRC antes de comparar para un orden correcto entre monedas mixtas

---

## 4. Módulo: Movimientos

**Ruta:** `/dashboard/movimientos`

### Estados de una transacción
| Estado | Descripción | Afecta balance |
|--------|-------------|----------------|
| `confirmed` | Transacción real registrada | ✅ Sí |
| `pending` | Borrador futuro o plantilla fija | ❌ No |

### Tipos
- **Ingreso** (`income`) — suma al balance de la cuenta
- **Gasto** (`expense`) — resta al balance de la cuenta

### Crear movimiento
1. Se selecciona tipo, categoría, monto, cuenta, fecha, descripción
2. Si `fecha <= hoy` y no es fijo → se crea como `confirmed` y actualiza balance inmediatamente (atómico)
3. Si `fecha > hoy` o es fijo → se crea como `pending`, sin tocar el balance

### Editar movimiento
- Permite cambiar todos los campos incluyendo la cuenta de origen
- Si cambia de cuenta: revierte el delta en la cuenta anterior y aplica en la nueva (ambos en la misma operación)
- Maneja correctamente el delta de ingreso→gasto o viceversa

### Eliminar movimiento
- Si era `confirmed`: revierte el balance en la cuenta
- Si era una plantilla fija: también elimina todas las confirmaciones de período (`fixed_confirmations`) para ese template

### Borradores (Drafts)
- Transacciones pendientes no-fijas (fecha futura)
- Visibles en la sección "Pendientes" del módulo
- Tienen menú con **Editar** y **Eliminar**
- Se confirman automáticamente desde el DueTodayCard cuando llega su fecha

### Filtros disponibles
- Período: semana / mes / trimestre / año
- Tipo: todos / ingresos / gastos
- Búsqueda por descripción
- Orden: fecha / mayor monto / menor monto

---

## 5. Módulo: Gastos fijos

**Ruta:** `/dashboard/gastos-fijos`

### Concepto clave
Un gasto o ingreso fijo es una **plantilla de recurrencia**, no una transacción real. Nunca toca el balance directamente. Genera un recordatorio en el DueTodayCard cuando llega su fecha, y el usuario decide si confirmarlo.

### Tipos de recurrencia
| Tipo | Descripción |
|------|-------------|
| `monthly` | Día específico del mes (ej. día 1, día 15) |
| `weekly` | Día específico de la semana (lunes=1 ... domingo=7) |
| `custom` | Cada N días |

### Regla de visibilidad
Un gasto fijo mensual solo aparece en el DueTodayCard cuando:
1. El **mes de inicio** del template ya llegó (no aparece si fue creado para el mes que viene)
2. El **día del mes** actual es ≥ al día configurado
3. No fue confirmado aún en el período actual

### Próximo vencimiento
- **Mensual:** próximo día configurado del mes (si ya pasó, siguiente mes)
- **Semanal:** próximo día de la semana configurado (si es hoy, muestra hoy)
- **Custom:** N días a partir de ahora

### Métricas del módulo
- **Total mensual** — suma de todos los gastos fijos en CRC
- **Por día** — total / 30
- **% del ingreso** — total fijos vs. ingreso de **este mes** (no del año)
- **Compromisos** — número de templates activos

### Control de duplicados
No se pueden crear dos gastos fijos con el mismo nombre. Se valida antes de guardar. Los items fijos también requieren nombre no vacío.

---

## 6. Módulo: Compromisos de hoy (DueTodayCard)

**Componente:** `DueTodayCard` (visible en el dashboard)

### Qué muestra
Todos los movimientos pendientes que vencen **hoy o antes** y no han sido confirmados en el período actual:
- Gastos/ingresos fijos cuya fecha ya llegó
- Borradores (drafts) con fecha ≤ hoy

### Acciones disponibles por item
| Botón | Acción |
|-------|--------|
| ✓ Pagado / Recibido | Confirma el item, crea transacción real, actualiza balance |
| ✗ Saltar | Oculta el item solo por hoy (localStorage) |
| Saltar todo | Oculta todos por hoy |

### Flujo de confirmación de gasto fijo
1. Registra el período en `fixed_confirmations` (DB) **primero**
2. Crea la transacción confirmada con fecha de hoy
3. El balance de la cuenta se actualiza atómicamente (RPC)
4. El item desaparece del card para este período

### Estado cross-device
Las confirmaciones de período se guardan en la tabla `fixed_confirmations` de la DB, no en localStorage. El estado es consistente en todos los dispositivos del usuario.

### Claves de período
- **Mensual:** `YYYY-MM` (ej. `2026-06`)
- **Semanal:** `YYYY-Www` en formato ISO (ej. `2026-W22`) — maneja correctamente el cruce de año

---

## 7. Módulo: Presupuestos

**Ruta:** `/dashboard/presupuestos`

### Concepto
Límite mensual por categoría de gasto. El sistema compara el gasto real del mes actual contra el límite definido.

### Estados visuales
| Condición | Color |
|-----------|-------|
| < 85% del límite | Verde |
| 85%–100% | Amarillo (advertencia) |
| > 100% | Rojo (excedido) |

### Porcentaje
- La **barra visual** se limita al 100% para no desbordar el diseño
- El **número mostrado** refleja el valor real (puede mostrar 134%, 210%, etc.)
- La etiqueta cambia a "excedido en X" cuando se supera el límite

### Funciones
- Crear presupuesto por categoría
- Editar límite
- Eliminar (soft delete con `user_id` validado)

---

## 8. Módulo: Metas de ahorro

**Ruta:** `/dashboard/metas`

### Estados de una meta
| Estado | Descripción |
|--------|-------------|
| `active` | En progreso |
| `completed` | Alcanzó el 100% (automático) |
| `paused` | Pausada manualmente |
| `cancelled` | Cancelada (con reembolso) |

### Crear meta
- Nombre, ícono, descripción, monto objetivo, moneda, fecha objetivo (opcional)

### Abonar a una meta
1. Se elige el monto en la moneda de la cuenta origen
2. Si la cuenta es en distinta moneda que la meta → se muestra banner de conversión con tasa actual para confirmación
3. Si el monto dejaría la cuenta en negativo → se muestra advertencia con el saldo resultante para confirmación
4. El abono es **atómico** (RPC `add_goal_contribution`):
   - Débita la cuenta origen
   - Acredita la meta
   - Registra el historial de contribución
   - Si la meta llega al 100% → cambia automáticamente a `completed`
   - El abono se **capa** al monto restante — la meta nunca puede exceder el objetivo

### Cancelar/Eliminar meta
- RPC `cancel_savings_goal` revierte **todos los abonos** a sus cuentas de origen (atómico)
- Soft delete de la meta (`deleted_at`)
- Para reembolsos cross-moneda usa el `account_amount` original (no la conversión actual)

### Historial de contribuciones
- Al expandir una meta se carga el historial de abonos
- Muestra: fecha, monto, cuenta origen, nota

### Proyección mensual
Si la meta tiene fecha objetivo, calcula cuánto aportar por mes para llegar a tiempo.

---

## 9. Módulo: Reportes

**Ruta:** `/dashboard/reportes`

### Períodos disponibles
Semana / Mes / Trimestre / Año

### Métricas calculadas (todas en CRC)
| Métrica | Descripción |
|---------|-------------|
| Ingresos | Suma de ingresos del período |
| Gastos | Suma de gastos del período |
| Ahorro neto | Ingresos − Gastos |
| Tasa de ahorro | Ahorro / Ingresos × 100 |
| Días de emergencia | Saldo total de cuentas de ahorro (suma de todas) / gasto diario promedio |
| Salud financiera | Score compuesto (tasa ahorro, ratio deuda, fondo emergencia) |

### Normalización de monedas
**Todos** los movimientos se convierten a CRC antes de cualquier cálculo usando el tipo de cambio en vivo. Los movimientos en USD se multiplican por `liveUsdRate`.

### Desglose por categoría
- Donut chart con gastos por categoría
- Top merchants (descripción más frecuente)

### Gráfica anual
- Evolución mes a mes de ingresos y gastos
- Convertida a CRC usando el tipo de cambio al momento de cargar
- Meses futuros se muestran vacíos

### Exportación
- **CSV** — exporta los movimientos del período como tabla
- **PDF** — reporte formateado con métricas, tabla de movimientos y top categorías

---

## 10. Módulo: Divisas

**Ruta:** `/dashboard/divisas`

### Fuente de datos
Currency API vía `/api/fx` — se carga al abrir el módulo y también al iniciar la app (para `liveUsdRate`).

### Fallback
Si la API falla, usa tasas de referencia estáticas almacenadas en `FX_RATES` y `FX_HISTORY`.

### Conversor
- CRC → USD o USD → CRC
- Usa la tasa en vivo; si no hay conexión usa el fallback
- Input en tiempo real, resultado automático

### Tabla de divisas
Muestra todas las divisas LATAM vs CRC con:
- Tasa de compra y venta
- Variación porcentual
- Indicador LIVE cuando los datos son en tiempo real

### Sparkline histórico
Evolución del USD/CRC en los últimos 12 meses.

---

## 11. Módulo: Perfil

**Ruta:** `/dashboard/perfil`

### Datos editables
- Nombre completo
- Moneda predeterminada
- Idioma (es/en)
- Tema (dark/light)
- Avatar

### Avatar
- **Subir foto** — PNG/JPG. Antes de subir, elimina archivos existentes en storage para evitar huérfanos al cambiar extensión. Se sube a `avatars/{user_id}/avatar.{ext}`
- **Emoji** — seleccionar un emoji como avatar
- **Quitar** — elimina el avatar (vuelve a las iniciales)

### Seguridad de cuenta
- Cambiar contraseña (via Supabase Auth)
- Eliminar cuenta (elimina todos los datos del usuario)

---

## 12. Módulo: Notificaciones

**Componente:** `NotificationsPanel` (slide-in desde la derecha)

### Tipos de notificación
| Tipo | Cuándo se genera |
|------|-----------------|
| `fixed_due` | Cuando hay compromisos del día al abrir la app |
| `budget_alert` | Al superar el 85% de un presupuesto |
| `goal_reached` | Al completar una meta de ahorro |

### Deduplicación
Las notificaciones `fixed_due` se deduplicán por título y fecha — no se insertan duplicados si ya existe una con el mismo título hoy.

### Marcado de lectura
Al abrir el panel, todas las notificaciones no leídas se marcan como leídas automáticamente.

### Sin memory leak
El listener de click-outside usa un `setTimeout` con ID guardado que se cancela en el cleanup, evitando listeners huérfanos al abrir/cerrar rápidamente.

---

## 13. Módulo: Dashboard principal

**Ruta:** `/dashboard`

### Componentes visibles
1. **DueTodayCard** — compromisos del día (si los hay)
2. **Balance total** — suma de todos los balances en CRC
3. **Ingresos vs gastos** del período
4. **Resumen de cuentas** — top 3 con balance y barra de proporción
5. **Presupuestos** — estado del mes actual
6. **Evolución anual** — gráfica de barras ingresos/gastos por mes
7. **Actividad reciente** — últimas transacciones

### Onboarding
Si el usuario no tiene cuentas registradas, se muestra el `OnboardingWizard` para guiarlo en la configuración inicial.

---

## 14. Capa de datos (db.ts y useData)

### useData — Estado global
`DataProvider` expone vía contexto:

| Estado | Descripción |
|--------|-------------|
| `accounts` | Cuentas activas del usuario |
| `movements` | Transacciones **confirmadas** únicamente |
| `pendingMovements` | Templates fijos + borradores del año actual |
| `budgets` | Presupuestos con gasto real calculado |
| `goals` | Metas de ahorro |
| `fixedConfirmations` | Períodos ya confirmados (de DB) |
| `liveUsdRate` | CRC por 1 USD (fallback: 510) |
| `notifications` | Historial de notificaciones |
| `unreadNotifications` | Contador de no leídas |

### Carga de datos
Al iniciar, `load()` hace un `Promise.all` de 9 fetches en paralelo, luego obtiene el tipo de cambio y construye la evolución anual. Se recarga completo después de cada mutación.

### db.ts — Funciones principales

| Función | Descripción |
|---------|-------------|
| `insertTransaction` | RPC atómico: crea transacción + actualiza balance |
| `updateTransaction` | Maneja cambio de cuenta revirtiendo delta anterior |
| `deleteTransaction` | Revierte balance + limpia fixed_confirmations si aplica |
| `confirmPendingTransaction` | RPC atómico: pending→confirmed + actualiza balance |
| `addGoalContribution` | RPC atómico: débita cuenta + acredita meta |
| `cancel_savings_goal` | RPC atómico: reembolsa todas las contribuciones + soft delete |
| `insertFixedConfirmation` | Upsert (ignora duplicados) en fixed_confirmations |
| `deleteBudgetByCategory` | Soft delete con filtro de user_id |
| `insertFixedDueNotification` | Inserta solo si no existe una igual hoy |

---

## 15. Integridad de datos y RPCs atómicos

Todas las operaciones que involucran **múltiples tablas** se ejecutan en una sola transacción PostgreSQL (RPC). Si cualquier paso falla, todo se revierte.

### RPCs en producción

#### `insert_transaction`
```
1. Resuelve moneda de la cuenta
2. INSERT en transactions (confirmed o pending según fecha)
3. Si confirmed → UPDATE balance en accounts
```

#### `confirm_pending_tx`
```
1. Lee la transacción pending
2. UPDATE status → confirmed
3. UPDATE balance en accounts (± según tipo)
```

#### `add_goal_contribution`
```
1. Lee current_amount y target_amount de la meta
2. Capa el aporte al monto restante
3. INSERT en goal_contributions
4. UPDATE current_amount en savings_goals
5. Si llega al target → status = 'completed'
6. UPDATE current_balance en accounts (débito)
```

#### `cancel_savings_goal`
```
1. Para cada contribución: UPDATE balance en accounts (reembolso)
2. UPDATE status = 'cancelled', deleted_at = NOW() en savings_goals
```

### Por qué importa
Sin RPCs, si el servidor cae entre dos UPDATE, la base de datos queda en estado inconsistente (transacción registrada sin impacto en balance, o balance cambiado sin transacción). Los RPCs garantizan **todo o nada**.

---

## 16. Multi-moneda

### Regla universal
Cada cuenta tiene su propia moneda. Los montos se almacenan en la moneda nativa de la cuenta.

### Conversión a CRC
Patrón usado en todos los módulos:
```ts
const toCRC = (amount: number, currency: string) =>
  currency === 'USD' ? amount * liveUsdRate : amount;
```

### Dónde se aplica
| Módulo | Qué se convierte |
|--------|-----------------|
| Dashboard | Balance total de todas las cuentas |
| Reportes | Todos los movimientos antes de cualquier cálculo |
| Presupuestos | Gastos del mes |
| Gastos fijos | Total mensual y % del ingreso |
| Cuentas | Sort de balance |
| Evolución anual | Ingresos y gastos por mes |
| Metas | Emergencia days (suma de cuentas de ahorro) |

### Abonos cross-currency a metas
Cuando la cuenta origen y la meta tienen distinta moneda:
- El modal muestra el monto convertido con la tasa actual para confirmación explícita
- La contribución registra tanto `amount` (moneda de meta) como `account_amount` (moneda de cuenta)
- En caso de cancelación, el reembolso usa `account_amount` (el monto original debitado)

---

## 17. Plan de membresía

### Campo `plan_status` en profiles
| Valor | Descripción |
|-------|-------------|
| `trial` | Período de prueba activo |
| `active` | Membresía activa |
| `blocked` | Acceso suspendido |

### Integración con LemonSqueezy (pendiente)
- LemonSqueezy actualiza `plan_status` vía webhook
- El bloqueo se aplica en el login: si `plan_status === 'blocked'` → signOut + mensaje al usuario
- El módulo de cobro es completamente independiente del core financiero

### Impacto en el core
La membresía **no afecta** ninguna operación financiera (transacciones, balances, metas, etc.). Es únicamente una puerta de acceso.

---

## Resumen de garantías del sistema

| Garantía | Mecanismo |
|----------|-----------|
| Balance nunca inconsistente | RPCs atómicos en PostgreSQL |
| Gastos fijos no corrompen balance | Arquitectura: templates nunca tocan cuentas |
| Estado cross-device | `fixed_confirmations` en DB, no localStorage |
| Sesión segura | `getUser()` (server-validated), no `getSession()` |
| Datos aislados por usuario | RLS en todas las tablas de Supabase |
| Notificaciones sin duplicados | Dedup por título+fecha antes de insertar |
| Metas no exceden objetivo | RPC capa el aporte al monto restante |
| Cancelar meta reembolsa | RPC `cancel_savings_goal` atómico |
| Conversiones USD/CRC consistentes | Normalización a CRC antes de cualquier cálculo |

---

*Documentación generada el 27 de mayo de 2026 · CoinDev v1.0*
