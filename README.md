# CoinDev — Finanzas Personales

> Aplicación web de finanzas personales pensada para el mercado costarricense. Controla tus ingresos, gastos, presupuestos, metas de ahorro y tipos de cambio en tiempo real, desde cualquier dispositivo.

---

## ¿Qué es CoinDev?

CoinDev es un SaaS de finanzas personales orientado a Costa Rica con soporte completo para colones (CRC) y dólares (USD). El usuario puede:

- Registrar ingresos y gastos con categorías
- Gestionar múltiples cuentas (banco, efectivo, tarjeta de crédito, inversión)
- Definir presupuestos mensuales por categoría con alertas automáticas
- Crear metas de ahorro y abonar desde sus cuentas
- Registrar gastos fijos recurrentes (alquiler, suscripciones, etc.)
- Ver tipos de cambio en tiempo real y un conversor interactivo
- Consultar reportes con distribución de gastos, tasa de ahorro y más
- Enviar reportes de bugs o mejoras directamente desde la app

El plan es **freemium**: período de prueba gratuito, luego plan Pro vía LemonSqueezy.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router, `'use client'`) |
| Lenguaje | TypeScript |
| Base de datos | Supabase — PostgreSQL 17 + Row Level Security |
| Auth | Supabase Auth (email/contraseña) |
| Estilos | CSS custom properties puras — sin Tailwind ni UI framework |
| Tipos de cambio | Currency API vía Edge Route `/api/fx` |
| Pagos | LemonSqueezy (checkout embed + webhook pendiente) |
| Deploy | Vercel (recomendado) |
| Fuentes | Geist + Geist Mono (Google Fonts) |

---

## Estructura de archivos

```
coindev/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (metadata, fuentes, lemon.js)
│   │   ├── page.tsx                    # Landing page + redirect auth
│   │   ├── login/page.tsx              # Inicio de sesión
│   │   ├── register/page.tsx           # Registro de cuenta nueva
│   │   ├── api/fx/route.ts             # Edge Route: tipos de cambio en vivo
│   │   └── dashboard/
│   │       ├── layout.tsx              # Shell: sidebar desktop + nav móvil + header
│   │       ├── page.tsx                # Inicio — resumen financiero + gráficas
│   │       ├── movimientos/page.tsx    # Historial de transacciones
│   │       ├── cuentas/page.tsx        # Gestión de cuentas
│   │       ├── presupuestos/page.tsx   # Presupuestos mensuales
│   │       ├── metas/page.tsx          # Metas de ahorro
│   │       ├── gastos-fijos/page.tsx   # Gastos recurrentes
│   │       ├── divisas/page.tsx        # Tipos de cambio + conversor
│   │       ├── reportes/page.tsx       # Análisis y reportes
│   │       └── admin/page.tsx          # Panel de administración (solo admin)
│   │
│   ├── components/
│   │   ├── screens/                    # Modales bottom-sheet de CRUD
│   │   │   ├── AddMovementModal.tsx    # Crear/editar transacción
│   │   │   ├── AddAccountModal.tsx     # Crear/editar cuenta
│   │   │   ├── AddBudgetModal.tsx      # Crear presupuesto
│   │   │   ├── AddGoalModal.tsx        # Crear meta de ahorro
│   │   │   ├── AddContributionModal.tsx # Abonar a una meta
│   │   │   ├── FeedbackModal.tsx       # Enviar reporte/sugerencia
│   │   │   ├── OnboardingWizard.tsx    # Flujo de bienvenida
│   │   │   └── SettingsPanel.tsx       # Configuración de perfil
│   │   ├── shell/
│   │   │   ├── CategoryGlyph.tsx       # Ícono circular con color de categoría
│   │   │   ├── Charts.tsx              # Donut, YearChart, HeroSwoosh
│   │   │   ├── MoneyText.tsx           # Monto coloreado por tipo (income/expense)
│   │   │   ├── PeriodChips.tsx         # Filtro semana/mes/año/todo
│   │   │   └── TrialBanner.tsx         # Banner de período de prueba
│   │   └── ui/
│   │       ├── Icon.tsx                # Íconos SVG inline (Lucide-like)
│   │       ├── Toast.tsx               # Notificaciones temporales
│   │       └── ConfirmModal.tsx        # Modal de confirmación genérico
│   │
│   ├── hooks/
│   │   ├── useApp.tsx                  # Contexto global: idioma, moneda, tema
│   │   └── useData.tsx                 # Contexto de datos + todas las mutaciones
│   │
│   └── lib/
│       ├── data.ts                     # Tipos TypeScript, categorías, helpers
│       ├── db.ts                       # Acceso a Supabase (todas las funciones CRUD)
│       └── supabase.ts                 # Cliente Supabase (browser)
│
├── docs/
│   ├── DATABASE.md                     # Esquema completo de la BD
│   └── MANUAL.md                       # Manual de usuario completo
│
├── scripts/
│   └── reset_db.sql                    # Limpia toda la BD (solo admin/dev)
│
├── supabase/
│   └── migrations/                     # Migraciones SQL aplicadas
│
└── public/
    ├── logo_coindev.png                # Fuente maestra del logo (1254×1254)
    ├── favicon.ico / favicon-32.png
    ├── apple-touch-icon.png
    ├── icon-192.png / icon-512.png
    └── manifest.json                   # PWA manifest
```

---

## Variables de entorno

Crear `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL=https://coindev.lemonsqueezy.com/checkout/...
```

> **Importante:** usar la clave **anon/public** de Supabase, nunca la `service_role`. La `service_role` bypasa todas las políticas RLS.

---

## Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Modo desarrollo (Turbopack)
npm run dev
# → http://localhost:3000

# Verificar tipos TypeScript
npx tsc --noEmit

# Build de producción
npm run build
npm start
```

---

## Base de datos

**Motor:** PostgreSQL 17 en Supabase (`lejxqydqgakehbauptal`, us-east-2)

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfil extendido del usuario (1:1 con `auth.users`) |
| `accounts` | Cuentas financieras (banco, efectivo, tarjeta, inversión) |
| `categories` | Categorías de ingresos/gastos (sistema + personalizadas) |
| `transactions` | Todos los movimientos financieros |
| `budgets` | Límites de gasto por categoría y período |
| `savings_goals` | Metas de ahorro con progreso |
| `goal_contributions` | Historial de aportes a metas |
| `fixed_expenses` | Gastos recurrentes fijos |
| `notifications` | Notificaciones in-app |
| `exchange_rates` | Caché de tipos de cambio (Currency API) |
| `feedback` | Reportes de usuarios (solo admin puede gestionar) |

RLS activo en todas las tablas. Ver [`docs/DATABASE.md`](docs/DATABASE.md) para el esquema completo.

### Script de limpieza (solo desarrollo)

```bash
# Ejecutar en Supabase SQL Editor
# Borra todos los datos, deja solo el admin con contraseña "123"
scripts/reset_db.sql
```

---

## Arquitectura de datos (contextos React)

### `useApp` — Preferencias del usuario
```typescript
{
  lang: 'es' | 'en',
  currency: 'CRC' | 'USD',
  theme: 'dark' | 'light',
  setLang, setCurrency, setTheme,
}
```

### `useData` — Datos y mutaciones
```typescript
{
  // Estado
  user, profile, accounts, movements, budgets, goals,
  yearEvolution, unreadNotifications, loading, liveUsdRate,

  // Transacciones
  addTransaction, updateTransaction, deleteTransaction,

  // Cuentas
  addAccount, updateAccount, deleteAccount,

  // Presupuestos
  addBudget, updateBudget, deleteBudget,

  // Metas
  addGoal, updateGoal, deleteGoal, addContribution,

  // Perfil
  saveProfile, refetch,
}
```

---

## Módulos del sistema

### Inicio (`/dashboard`)
Resumen financiero: balance neto, ingresos/gastos del período, donut de categorías, evolución anual (barras), estado de presupuestos y listado de cuentas.

### Movimientos (`/dashboard/movimientos`)
Historial de transacciones con filtros por tipo e búsqueda libre. Agrupa por fecha ("Hoy", "Ayer"). Soporte para transacciones recurrentes y transferencias entre cuentas.

### Cuentas (`/dashboard/cuentas`)
CRUD de cuentas. Para tarjetas de crédito muestra límite y porcentaje de uso. Soft delete al eliminar — el historial de transacciones se conserva.

### Presupuestos (`/dashboard/presupuestos`)
Límites mensuales por categoría. Barra de progreso coloreada (verde → amarillo → rojo). Alerta automática al llegar al umbral configurado (default 80%).

### Metas (`/dashboard/metas`)
Metas de ahorro con progreso visual. Cada aporte descuenta de la cuenta de origen. Soporte para conversión de moneda (CRC ↔ USD) al abonar.

### Gastos Fijos (`/dashboard/gastos-fijos`)
Compromisos recurrentes con fecha de próximo vencimiento. Muestra el total mensual comprometido.

### Divisas (`/dashboard/divisas`)
Tipos de cambio en tiempo real (CRC, USD, EUR, MXN y más). Conversor interactivo y sparkline de tendencia.

### Reportes (`/dashboard/reportes`)
Análisis: distribución de gastos (donut), movimientos del período, tasa de ahorro, ratio gastos fijos/ingresos, días de fondo de emergencia.

### Admin (`/dashboard/admin`)
Solo accesible para `stevengalocr@gmail.com`. Gestiona usuarios (cambio de plan, notas, eliminación) y reportes de feedback (cambio de estado, eliminación).

---

## Convenciones de código

| Convención | Descripción |
|-----------|-------------|
| **Soft delete** | Cuentas, transacciones y metas nunca se eliminan físicamente (`deleted_at = now()` o `is_active = false`) |
| **Monedas** | Todo se almacena en la moneda de la cuenta. `exchange_rate` guarda el tipo al momento del registro |
| **Fechas** | `DATE` (sin hora). Al leer se reconstruyen con 12:00 local para evitar drift de timezone |
| **Categorías** | Mapping slug ↔ UUID en `src/lib/db.ts`. El campo `notes` guarda el slug como fallback |
| **Modales** | Bottom-sheet con animación slide-up. Confirmación de eliminación en dos pasos |
| **Toasts** | `const toast = useToast(); toast('Mensaje', 'success' \| 'error' \| 'info')` |
| **Sin transform en page-enter** | La animación de entrada de página usa solo `opacity` para no romper `position: fixed` en modales |

---

## Estado del proyecto

| Área | Estado |
|------|--------|
| Auth (login, registro, onboarding) | ✅ Completo |
| Dashboard + gráficas | ✅ Completo |
| Cuentas, movimientos, presupuestos | ✅ Completo |
| Metas de ahorro + aportes multi-moneda | ✅ Completo |
| Gastos fijos + divisas + reportes | ✅ Completo |
| Panel de admin | ✅ Completo |
| Landing page + LemonSqueezy embed | ✅ Completo |
| PWA (manifest, icons) | ✅ Completo |
| Tema claro/oscuro + ES/EN | ✅ Completo |
| **LemonSqueezy webhook** (`/api/webhooks/lemonsqueezy`) | 🔴 Pendiente |
| Anon key (reemplazar service_role) | 🔴 Pendiente |
| Página 404 personalizada | 🟡 Pendiente |
| Privacy Policy / Terms of Use | 🟡 Pendiente |

Ver [`PENDING.md`](PENDING.md) para el detalle completo de pendientes.

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [`docs/DATABASE.md`](docs/DATABASE.md) | Esquema completo de BD: tablas, columnas, RLS, triggers, ENUMs |
| [`docs/MANUAL.md`](docs/MANUAL.md) | Manual de usuario completo — todo lo que el usuario necesita saber |
| [`PENDING.md`](PENDING.md) | Tareas pendientes antes del lanzamiento SaaS |
| [`scripts/reset_db.sql`](scripts/reset_db.sql) | Script SQL para limpiar la BD en desarrollo |
