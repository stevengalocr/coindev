# CoinDev — Finanzas Personales

Aplicación web de finanzas personales orientada al mercado costarricense. Permite registrar ingresos y gastos, gestionar cuentas, definir presupuestos mensuales, establecer metas de ahorro y consultar tipos de cambio en tiempo real.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, `'use client'`) |
| Lenguaje | TypeScript |
| Backend / Auth / DB | Supabase (PostgreSQL 17 + RLS + Auth) |
| Estilos | CSS custom properties (variables CSS), sin framework de UI |
| Tipos de cambio | Currency API (vía Edge Function `/api/fx`) |
| Deploy | Vercel (recomendado) |

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (fuentes, tema)
│   ├── page.tsx                    # Redirect → /login o /dashboard
│   ├── login/page.tsx              # Inicio de sesión
│   ├── register/page.tsx           # Registro de usuario
│   ├── api/fx/route.ts             # Edge function: tipos de cambio
│   └── dashboard/
│       ├── layout.tsx              # Shell del dashboard (sidebar, header, nav móvil)
│       ├── page.tsx                # Inicio — resumen general
│       ├── movimientos/page.tsx    # Historial de transacciones
│       ├── cuentas/page.tsx        # Gestión de cuentas
│       ├── presupuestos/page.tsx   # Presupuestos mensuales
│       ├── metas/page.tsx          # Metas de ahorro
│       ├── gastos-fijos/page.tsx   # Gastos recurrentes
│       ├── divisas/page.tsx        # Tipos de cambio en vivo
│       └── reportes/page.tsx       # Reportes y análisis
│
├── components/
│   ├── screens/                    # Modales de CRUD
│   │   ├── AddMovementModal.tsx
│   │   ├── AddAccountModal.tsx
│   │   ├── AddBudgetModal.tsx
│   │   ├── AddGoalModal.tsx
│   │   ├── AddContributionModal.tsx
│   │   └── SettingsPanel.tsx
│   ├── shell/                      # Componentes reutilizables del dashboard
│   │   ├── CategoryGlyph.tsx       # Ícono con fondo de color por categoría
│   │   ├── Charts.tsx              # Donut, YearChart, HeroSwoosh
│   │   ├── MoneyText.tsx           # Monto formateado con color de tipo
│   │   └── PeriodChips.tsx         # Filtro de período (semana/mes/año/todo)
│   └── ui/
│       └── Icon.tsx                # Sistema de íconos SVG inline
│
├── hooks/
│   ├── useApp.tsx                  # Contexto global: idioma, moneda, tema
│   └── useData.tsx                 # Contexto de datos: cuentas, movimientos, metas…
│
└── lib/
    ├── data.ts                     # Tipos TS, categorías, helpers de cálculo
    ├── db.ts                       # Funciones de acceso a Supabase (CRUD)
    └── supabase.ts                 # Cliente Supabase (SSR)
```

---

## Módulos del Sistema

### Inicio (`/dashboard`)
Resumen general del usuario. Muestra balance neto total (suma de todas las cuentas), ingresos y gastos del período seleccionado, distribución por categoría (donut), evolución anual (gráfico de barras), estado de presupuestos y listado de cuentas.

### Movimientos (`/dashboard/movimientos`)
CRUD completo de transacciones. Filtros por tipo (ingreso/gasto/todos) y búsqueda por descripción. Agrupa por fecha con etiquetas "Hoy" / "Ayer". Soporta marcado como gasto fijo/recurrente.

### Cuentas (`/dashboard/cuentas`)
Gestión de cuentas bancarias, efectivo, ahorro y tarjetas de crédito. Muestra saldo actual, límite de crédito y porcentaje de uso para tarjetas. Soft delete al eliminar.

### Presupuestos (`/dashboard/presupuestos`)
Límites de gasto mensual por categoría. Muestra el gasto real del mes en curso vs. el límite definido. Barra de progreso con alerta visual al superar el umbral (default 80%).

### Metas (`/dashboard/metas`)
Metas de ahorro con nombre, ícono, monto objetivo y fecha límite. Soporta **aportes manuales**: cada abono descuenta de la cuenta de origen y suma al progreso de la meta. Historial de aportes por meta (lazy-load). Estados: activa / pausada / completada / cancelada.

### Gastos Fijos (`/dashboard/gastos-fijos`)
Registro de gastos recurrentes (alquiler, suscripciones, servicios). Muestra próxima fecha de vencimiento y total mensual comprometido.

### Divisas (`/dashboard/divisas`)
Tipos de cambio USD/CRC y otras monedas en tiempo real vía Currency API. Incluye conversor interactivo entre pares de monedas, sparkline de tendencia y pills de compra/venta.

### Reportes (`/dashboard/reportes`)
Análisis financiero: distribución de gastos (donut), top comercios, evolución mensual, tasa de ahorro, ratio gastos fijos/ingresos y días de fondo de emergencia.

---

## Estado de Datos (Contextos React)

### `useApp` — Preferencias del usuario
```typescript
{ lang: 'es' | 'en', currency: 'CRC' | 'USD', theme: 'dark' | 'light', t: Translations }
```

### `useData` — Datos de negocio
```typescript
{
  user, profile, accounts, movements, budgets, goals, yearEvolution,
  unreadNotifications, loading,
  // Mutaciones:
  addTransaction, updateTransaction, deleteTransaction,
  addAccount, updateAccount, deleteAccount,
  addBudget, updateBudget, deleteBudget,
  addGoal, updateGoal, deleteGoal,
  addContribution,
  saveProfile, refetch,
}
```

---

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## Instalación y Desarrollo

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Build de producción
npx tsc --noEmit    # Verificar tipos
```

---

## Convenciones de Código

- **Soft delete**: Las cuentas, transacciones, metas y gastos fijos nunca se eliminan físicamente. Se marca `deleted_at = now()` o `is_active = false`.
- **Monedas**: Todo se almacena en la moneda de la cuenta. El campo `exchange_rate` guarda el tipo de cambio al momento del registro.
- **Fechas**: Las fechas de transacciones se almacenan como `DATE` (sin hora). Al leer, se reconstruyen con hora 12:00 local para evitar drift de timezone.
- **Categorías**: El mapping slug ↔ UUID está en `src/lib/db.ts`. El campo `notes` de `transactions` guarda el slug de categoría como fallback.
- **Patrones UI**: Modales bottom-sheet con animación slide-up. Confirmación de eliminación en dos pasos (click → "¿Confirmar?" → click).

---

## Documentación Adicional

- [`docs/DATABASE.md`](docs/DATABASE.md) — Esquema completo de la base de datos
- [`docs/backup.sql`](docs/backup.sql) — Script SQL de respaldo y restauración
