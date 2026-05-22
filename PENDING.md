# CoinDev — Pendientes para lanzamiento SaaS

Fecha de revisión: 2026-05-22

---

## 🔴 Crítico (bloquea producción)

### 1. Reemplazar `service_role` key por `anon` key
**Archivo:** `.env.local`  
**Problema:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` contiene actualmente la clave `service_role` (visible en el JWT: `"role":"service_role"`). Esto **bypasa todas las políticas RLS**, exponiendo datos de todos los usuarios a cualquier request del cliente.  
**Fix:** Ir a Supabase Dashboard → Project Settings → API → copiar el valor de **anon / public key** y reemplazarlo en `.env.local` y en las variables de entorno de Vercel.

### 2. Webhook de LemonSqueezy → Supabase
**Problema:** El pago en LemonSqueezy no actualiza `plan_status` en la base de datos automáticamente.  
**Fix requerido:**
- Crear un endpoint `POST /api/webhooks/lemonsqueezy` (Edge Route en Next.js).
- Verificar firma HMAC con `LEMONSQUEEZY_WEBHOOK_SECRET`.
- En el evento `order_created` (o `subscription_activated`): buscar el perfil por email y actualizar `plan_status = 'active'`.
- Configurar el webhook en LemonSqueezy Dashboard → Settings → Webhooks → apuntar a `https://tu-dominio.com/api/webhooks/lemonsqueezy`.

```ts
// Esquema de implementación
// src/app/api/webhooks/lemonsqueezy/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get('x-signature') ?? '';
  // 1. verifySignature(body, sig, process.env.LEMONSQUEEZY_WEBHOOK_SECRET)
  // 2. const event = JSON.parse(body)
  // 3. if (event.meta.event_name === 'order_created') → updateUserPlan(email, 'active')
}
```

### 3. Variables de entorno en Vercel
Agregar en Vercel → Project Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (**anon key, no service_role**)
- `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL`
- `LEMONSQUEEZY_WEBHOOK_SECRET` (para el webhook)

---

## 🟡 Importante (lanzamiento limpio)

### 4. Política de privacidad y Términos de uso
LemonSqueezy **exige** tener URL de Privacy Policy y Terms of Service activos en el producto antes de aprobar el store.  
- Crear `/politica-de-privacidad` y `/terminos-de-uso` como páginas Next.js estáticas.
- Agregar links en el footer de la landing (`src/app/page.tsx`).

### 5. Email de confirmación / onboarding
Supabase Auth envía confirmación de correo por defecto, pero el copy está en inglés.  
**Fix:** Supabase Dashboard → Authentication → Email Templates → personalizar en español con la marca CoinDev.

### 6. Rate limiting en `/api/fx`
El endpoint de tipos de cambio (`src/app/api/fx/route.ts`) puede ser abusado.  
**Fix:** Agregar cabecera `Cache-Control: s-maxage=3600` (ya implementado) + considerar verificar `Referer` o agregar un secreto de API interno.

### 7. Página 404 personalizada
**Archivo a crear:** `src/app/not-found.tsx`  
Sin esto, Next.js muestra el 404 genérico sin el diseño del sitio.

### 8. `middleware.ts` deprecation warning
El archivo `src/middleware.ts` genera el warning:
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```
**Fix:** Renombrar a `src/proxy.ts` y ajustar la API según la guía de Next.js 16.  
Ver: `node_modules/next/dist/docs/` para la documentación correcta.

---

## 🟢 Mejoras post-lanzamiento

### 9. Webhook para cancelaciones / reembolsos
Además de `order_created`, manejar:
- `subscription_cancelled` → `plan_status = 'pending_payment'`
- `order_refunded` → `plan_status = 'trial'` o `blocked`

### 10. Portal de cliente LemonSqueezy
LemonSqueezy genera un customer portal automático. Agregar un link "Gestionar suscripción" en el panel de Settings del usuario (`src/components/screens/SettingsPanel.tsx`).

### 11. PWA — actualizar `manifest.json`
Verificar que `/public/manifest.json` tenga `start_url`, `display: standalone`, `background_color` y `theme_color` alineados con el diseño actual (`#07070d`).

### 12. Open Graph / Social preview
`src/app/layout.tsx` no tiene `openGraph` ni `twitter` en el objeto `metadata`.  
Agregar imagen OG (1200×630) y las propiedades correspondientes para que los links compartidos en redes luzcan bien.

### 13. Analytics
Ningún proveedor de analytics está configurado.  
Opciones: Vercel Analytics (gratis con plan hobby), Plausible, PostHog.

### 14. Exportación de datos
Los usuarios deben poder exportar sus movimientos en CSV. Ya existe `/dashboard/reportes` con datos — considerar agregar botón "Exportar CSV".

### 15. Recuperación de contraseña
Verificar que el flujo de reset password de Supabase Auth esté correctamente redirigiendo a la app (URL de redirección en Supabase Dashboard → Authentication → URL Configuration).

---

## ✅ Ya completado

- [x] Landing page completa con diseño del reference y copy para mercado costarricense
- [x] LemonSqueezy checkout embed integrado (`lemonsqueezy-button` class + `lemon.js` en layout)
- [x] `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` en `.env.local`
- [x] Build limpio sin errores TypeScript (18 rutas compiladas)
- [x] Animaciones de entrada en dashboard (`page-enter`, `stagger`)
- [x] Panel de admin funcional (gestión manual de `plan_status` por usuario)
- [x] RLS activo en todas las tablas de Supabase
- [x] Soft delete en lugar de borrado físico
- [x] Converter USD/CRC en tiempo real vía Edge Function `/api/fx`
- [x] Trial banner para usuarios en período de prueba
- [x] Sistema de feedback de usuarios (modal + tabla en admin)
- [x] Soporte bilingual (español/inglés) con `useApp` context
- [x] PWA manifest y apple-touch-icon configurados
- [x] Turbopack `root` configurado para eliminar warning de workspace
