# CoinDev — Manual de Usuario

Bienvenido a CoinDev, tu app de finanzas personales para Costa Rica. Este manual cubre todo lo que necesitás saber para sacarle el máximo provecho a la aplicación.

---

## Tabla de contenidos

1. [Primeros pasos](#1-primeros-pasos)
2. [Inicio — Tu resumen financiero](#2-inicio--tu-resumen-financiero)
3. [Movimientos](#3-movimientos)
4. [Cuentas](#4-cuentas)
5. [Presupuestos](#5-presupuestos)
6. [Metas de ahorro](#6-metas-de-ahorro)
7. [Gastos fijos](#7-gastos-fijos)
8. [Divisas](#8-divisas)
9. [Reportes](#9-reportes)
10. [Configuración y perfil](#10-configuración-y-perfil)
11. [Notificaciones](#11-notificaciones)
12. [Enviar un reporte o sugerencia](#12-enviar-un-reporte-o-sugerencia)
13. [Plan gratuito vs. Pro](#13-plan-gratuito-vs-pro)
14. [Preguntas frecuentes](#14-preguntas-frecuentes)

---

## 1. Primeros pasos

### Crear una cuenta

1. Ingresá a la app y hacé clic en **Crear cuenta**.
2. Completá tu nombre, correo electrónico y contraseña (mínimo 8 caracteres).
3. Verificá tu correo: te llegará un mensaje con un enlace de confirmación. Hacé clic en él.
4. Iniciá sesión con tus credenciales.

### Onboarding (configuración inicial)

La primera vez que entrás al dashboard, el asistente de bienvenida te guía en 3 pasos:

1. **Tu moneda principal** — elegís entre CRC (colón) y USD (dólar). Podés cambiar esto después en Configuración.
2. **Tu primera cuenta** — agregás al menos una cuenta (banco, efectivo, etc.) con tu saldo actual.
3. **Listo** — quedás dentro del dashboard con tus datos iniciales.

> Si cerrás el onboarding antes de terminarlo, podés agregar cuentas manualmente desde la sección **Cuentas**.

### Iniciar sesión

1. Ingresá tu correo y contraseña.
2. Si olvidaste tu contraseña, usá la opción **¿Olvidaste tu contraseña?** para recibir un enlace de restablecimiento por correo.

---

## 2. Inicio — Tu resumen financiero

La pantalla de inicio es tu centro de control. Desde ahí ves de un vistazo cómo van tus finanzas.

### Filtro de período

En la parte superior encontrás los filtros de tiempo:

| Filtro | Qué muestra |
|--------|-------------|
| **Semana** | Los últimos 7 días |
| **Mes** | El mes calendario actual |
| **Año** | El año en curso |
| **Todo** | Todo el historial |

### Tarjetas de resumen

- **Balance neto total** — suma de todas tus cuentas activas (excluyendo las que marcaste "no incluir en total").
- **Ingresos del período** — total de entradas de dinero en el período seleccionado.
- **Gastos del período** — total de salidas de dinero.

### Gráfica de categorías (donut)

Muestra cómo se distribuyen tus gastos del período entre categorías. Pasá el cursor (o tocá en móvil) sobre cada segmento para ver el monto exacto y el porcentaje.

### Evolución anual (barras)

Gráfico de barras mes a mes del año en curso. Barras verdes = ingresos, barras rojas/rosadas = gastos. Te permite ver tendencias y detectar meses atípicos.

### Estado de presupuestos

Vista rápida de tus presupuestos del mes: cuánto llevás gastado de cada límite. Barra roja = superaste el límite.

### Mis cuentas

Lista de todas tus cuentas con saldo actual. Podés tocar cualquiera para ir directamente a la gestión de cuentas.

---

## 3. Movimientos

### Ver el historial

En **Movimientos** encontrás todas tus transacciones agrupadas por fecha, de más reciente a más antigua. Las etiquetas "Hoy" y "Ayer" facilitan la lectura.

Cada movimiento muestra:
- Ícono y nombre de categoría
- Descripción
- Cuenta de origen
- Fecha
- Monto (verde = ingreso, rojo = gasto)

### Filtrar movimientos

- **Todos / Ingresos / Gastos** — tabs en la parte superior para filtrar por tipo.
- **Buscador** — escribí cualquier parte de la descripción para filtrar al instante.

### Agregar un movimiento

1. Tocá el botón **+** (botón flotante dorado).
2. Elegí el tipo: **Ingreso** o **Gasto** (o **Transferencia** si movés dinero entre cuentas tuyas).
3. Completá los campos:

| Campo | Descripción |
|-------|-------------|
| **Monto** | Cantidad. Siempre positivo — el tipo define si es entrada o salida |
| **Descripción** | Breve descripción del movimiento (ej: "Supermercado Perimercados") |
| **Cuenta** | De qué cuenta sale o entra el dinero |
| **Categoría** | Clasificación del gasto o ingreso |
| **Fecha** | Por defecto es hoy, pero podés cambiarla |
| **Nota** *(opcional)* | Información adicional |
| **Gasto fijo / recurrente** *(opcional)* | Si marcás esta opción, podés definir si se repite diario, semanal, quincenal, mensual, trimestral o anual |

4. Tocá **Guardar**.

> El saldo de la cuenta se actualiza automáticamente al guardar.

### Tipos de movimiento

**Ingreso:** entra dinero a una cuenta (salario, freelance, intereses, etc.)

**Gasto:** sale dinero de una cuenta (supermercado, transporte, servicios, etc.)

**Transferencia:** movés dinero de una cuenta tuya a otra (ej: de tu cuenta corriente a tu cuenta de ahorro). No afecta el total de tu patrimonio.

### Editar un movimiento

Tocá el movimiento en la lista → aparece un menú con la opción **Editar**. Modificá los campos necesarios y guardá.

### Eliminar un movimiento

Tocá el movimiento → **Eliminar** → confirmá. El monto se revierte en el saldo de la cuenta automáticamente.

> Los movimientos eliminados no se pueden recuperar desde la app. El saldo de la cuenta se ajusta en el momento.

### Movimientos recurrentes

Si un gasto se repite (ej: pago de Netflix cada mes), marcá la opción **Gasto fijo / recurrente** al crear el movimiento y seleccioná la frecuencia. Esto lo registra como recurrente en el historial pero **no** lo programa automáticamente — cada movimiento se crea cuando vos lo registrás. Para compromisos automáticos, usá la sección **Gastos Fijos**.

---

## 4. Cuentas

### Tipos de cuenta

| Tipo | Cuándo usarlo |
|------|---------------|
| **Banco / Corriente** | Cuenta de banco donde recibís salario o pagás con débito |
| **Ahorro** | Cuenta de ahorro separada |
| **Efectivo** | Dinero físico que tenés en la billetera |
| **Tarjeta de crédito** | Tarjeta de crédito — el saldo reflejado es la deuda actual |
| **Inversión** | Fondos de inversión, acciones, etc. |
| **Otra** | Cualquier otro tipo de activo financiero |

### Crear una cuenta

1. En **Cuentas**, tocá **+ Nueva cuenta**.
2. Completá:

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Ej: "BAC Colones", "Efectivo", "Visa Gold" |
| **Tipo** | Ver tabla de tipos arriba |
| **Saldo inicial** | Cuánto tenés en esta cuenta HOY al momento de crearla en CoinDev |
| **Moneda** | CRC o USD |
| **Color** | Para identificarla visualmente |
| **Ícono** | Ícono representativo |

Para **tarjetas de crédito** aparecen campos adicionales:
- **Límite de crédito** — línea de crédito aprobada
- **Día de corte** — día del mes en que cierra el estado de cuenta
- **Tasa de interés** — tasa anual en porcentaje
- **Últimos 4 dígitos** — para identificar la tarjeta

3. Tocá **Guardar**.

### Saldo en tarjetas de crédito

En las tarjetas de crédito, el saldo mostrado representa **la deuda actual**. Cuando registrás un gasto con tarjeta, la deuda sube. La barra de uso muestra qué porcentaje del límite estás usando.

> Si la tarjeta tiene saldo a favor (mayor al límite), el monto aparece en verde.

### Editar o eliminar una cuenta

Tocá los tres puntos (⋯) en la tarjeta de la cuenta → **Editar** o **Eliminar**.

Al eliminar una cuenta, esta queda desactivada (soft delete): el historial de movimientos se conserva pero la cuenta ya no aparece en el balance ni en los selectores de movimiento. **Esta acción no se puede revertir desde la app.**

### Balance neto

El total que aparece en el Dashboard es la suma de todas las cuentas donde **Incluir en total** está activo. Si tenés una cuenta de inversión que no querés contar en tu liquidez diaria, podés desmarcar esa opción al editar la cuenta.

---

## 5. Presupuestos

Los presupuestos te ayudan a controlar cuánto gastás en cada categoría por mes.

### Crear un presupuesto

1. En **Presupuestos**, tocá **+ Nuevo presupuesto**.
2. Elegí la **categoría** (ej: Alimentación, Transporte).
3. Definí el **límite** en tu moneda preferida.
4. Tocá **Guardar**.

### Seguimiento del presupuesto

Cada presupuesto muestra:
- **Gastado:** total de gastos del mes actual en esa categoría
- **Límite:** el monto máximo que definiste
- **Barra de progreso:** se torna roja cuando superás el límite

### Alertas de presupuesto

Cuando tus gastos alcanzan el 80% del límite (configurable por defecto), la app crea una notificación automática avisándote. Esto te da tiempo de ajustar antes de pasarte.

### Editar o eliminar un presupuesto

Tocá el presupuesto en la lista → **Editar** o **Eliminar** usando los botones que aparecen en la tarjeta.

> Solo podés tener un presupuesto por categoría. Si ya tenés uno en "Alimentación" y querés cambiarlo, editá el existente.

---

## 6. Metas de ahorro

Las metas te permiten ahorrar para objetivos concretos: vacaciones, un carro, fondo de emergencia, etc.

### Crear una meta

1. En **Metas**, tocá **+ Nueva meta**.
2. Completá:

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Ej: "Vacaciones en Guanacaste", "Fondo de emergencia" |
| **Ícono** | Emoji representativo |
| **Monto objetivo** | Cuánto querés ahorrar |
| **Moneda** | CRC o USD |
| **Fecha límite** *(opcional)* | Para cuándo querés lograrla |

3. Tocá **Guardar**.

### Abonar a una meta

1. En la tarjeta de la meta, tocá **Abonar**.
2. Elegí el **monto** a depositar.
3. Elegí la **cuenta de origen** de donde saldrá el dinero.
4. Opcionalmente agregá una **nota** (ej: "Quincena de mayo").
5. Tocá **Confirmar abono**.

Al abonar:
- El saldo de la cuenta de origen **disminuye** en el monto abonado.
- El progreso de la meta **aumenta** en el mismo monto.

> Si la cuenta es en USD y la meta está en CRC (o viceversa), la app calcula la conversión automáticamente usando el tipo de cambio en tiempo real antes de confirmar. Verás el monto equivalente antes de confirmar.

### Historial de aportes

Dentro de cada meta hay un botón para ver todos los aportes realizados: fecha, monto y nota de cada uno.

### Estados de una meta

| Estado | Descripción |
|--------|-------------|
| **Activa** | En progreso |
| **Completada** | Alcanzaste el monto objetivo |
| **Pausada** | La pausaste temporalmente |
| **Cancelada** | Decidiste no seguir con ella |

Para cambiar el estado, editá la meta y seleccioná el nuevo estado. Cuando alcancés el 100% del objetivo, la meta se puede marcar como **Completada** manualmente.

---

## 7. Gastos fijos

Los gastos fijos son compromisos que pagás regularmente: alquiler, electricidad, internet, suscripciones, etc.

### Crear un gasto fijo

1. En **Gastos Fijos**, tocá **+ Nuevo gasto fijo**.
2. Completá:

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Ej: "Alquiler", "Netflix", "Internet Kolbi" |
| **Monto** | Cuánto pagás cada vez |
| **Moneda** | CRC o USD |
| **Categoría** | Clasificación del gasto |
| **Cuenta de pago** | Desde qué cuenta se paga |
| **Recurrencia** | Con qué frecuencia: diario, semanal, quincenal, mensual, trimestral o anual |
| **Próximo vencimiento** | Cuándo toca el siguiente pago |
| **Notas** *(opcional)* | Información adicional |

3. Tocá **Guardar**.

### Panel de gastos fijos

La pantalla muestra todos tus compromisos activos con:
- Días que faltan para el próximo vencimiento
- Color de urgencia: verde (más de 7 días), amarillo (menos de 7), rojo (hoy o vencido)
- **Total mensual comprometido** en la parte superior — suma de todos los gastos fijos normalizados a mensual

> Los gastos fijos **no se pagan automáticamente**. Son un recordatorio de tus compromisos. Cuando llegue la fecha, entrás a Movimientos y registrás el gasto normalmente. La sección de Gastos Fijos te ayuda a saber cuánto tenés comprometido mes a mes.

### Editar o eliminar un gasto fijo

Tocá el ícono de edición (lápiz) en la tarjeta del gasto → modificá los campos → **Guardar**. Para eliminar, usá el botón de eliminar (basurero).

---

## 8. Divisas

### Tipos de cambio en tiempo real

La sección de **Divisas** muestra los tipos de cambio actualizados frente al dólar (USD):

- Colón costarricense (CRC)
- Euro (EUR)
- Peso mexicano (MXN)
- Y otras monedas populares

Los datos se actualizan periódicamente desde Currency API.

### Conversor de monedas

En la parte superior de la pantalla hay un conversor interactivo:
1. Ingresá el **monto** que querés convertir.
2. Seleccioná la **moneda de origen** y la **moneda destino**.
3. El resultado aparece al instante.

También podés invertir el par tocando el botón de intercambio (↕).

### Indicadores de compra/venta

Para el par CRC/USD, se muestran pills de referencia con el tipo de **compra** (cuántos colones te dan por 1 USD si vendés dólares) y **venta** (cuántos colones pagás por 1 USD si comprás dólares). Estos valores son de referencia general; los tipos exactos varían según el banco o casa de cambio.

---

## 9. Reportes

La sección de reportes analiza tus datos y te da métricas avanzadas.

### Métricas disponibles

| Métrica | Qué significa |
|---------|---------------|
| **Distribución de gastos** | Donut que muestra qué porcentaje va a cada categoría en el período |
| **Movimientos del período** | Lista de transacciones filtradas del período seleccionado |
| **Tasa de ahorro** | `(Ingresos - Gastos) / Ingresos × 100` — qué porcentaje de lo que ganás lograste ahorrar |
| **Ratio gastos fijos** | Qué porcentaje de tus ingresos están comprometidos en gastos fijos |
| **Días de fondo de emergencia** | Cuántos días podrías sobrevivir con tu balance actual si dejaras de ganar dinero, basado en tu gasto promedio diario |

### Filtro de período

Usá los chips de período (Semana / Mes / Año / Todo) para ajustar el rango de análisis.

> Los reportes se calculan en tiempo real. No hay nada que "generar" — lo que ves siempre refleja tus datos actuales.

---

## 10. Configuración y perfil

### Abrir configuración

- **En escritorio:** hacé clic en tu avatar o nombre en el sidebar izquierdo.
- **En móvil:** tocá el ícono de perfil en la barra de navegación inferior.

### Opciones de configuración

#### Perfil
- **Nombre completo** — cómo aparecés en la app
- **Avatar** — URL de imagen de perfil (opcional)

#### Preferencias
- **Idioma** — Español o English (afecta textos, etiquetas y formatos)
- **Moneda predeterminada** — CRC o USD (moneda que se preselecciona al crear movimientos)
- **Tema** — Oscuro / Claro / Sistema (sigue la configuración de tu dispositivo)

### Cerrar sesión

Desde el panel de Configuración, tocá **Cerrar sesión** para salir de tu cuenta. Tus datos quedan guardados en la nube — la próxima vez que inicies sesión estarán intactos.

---

## 11. Notificaciones

### Tipos de notificaciones

CoinDev genera notificaciones automáticas para:

| Tipo | Cuándo se genera |
|------|-----------------|
| **Alerta de presupuesto** | Cuando tus gastos alcanzan el umbral configurado (default 80%) |
| **Meta alcanzada** | Cuando llegás al 100% de una meta de ahorro |
| **Gasto fijo próximo** | Recordatorio de un gasto fijo que vence pronto |
| **Resumen semanal** | Resumen de movimientos de la semana |
| **Resumen mensual** | Resumen del mes que acaba de cerrar |

### Ver notificaciones

Tocá el ícono de campana (🔔) en el header del dashboard. El número rojo indica cuántas notificaciones sin leer tenés.

Al entrar a la lista, podés tocar cada notificación para marcarla como leída.

---

## 12. Enviar un reporte o sugerencia

Si encontraste un problema o tenés una idea para mejorar CoinDev, podés enviar un reporte directamente desde la app.

1. En el sidebar (escritorio) o en el menú de configuración (móvil), buscá la opción **Reportar problema / sugerencia**.
2. Completá el formulario:

| Campo | Descripción |
|-------|-------------|
| **Tipo** | Bug (algo no funciona), Mejora (idea nueva) o Consulta (pregunta) |
| **Título** | Resumen corto del problema o sugerencia |
| **Descripción** | Explicación detallada. Incluí pasos para reproducir el bug si aplica |

3. Tocá **Enviar reporte**.

El equipo recibirá tu reporte y podrá actualizar el estado a **En revisión** o **Resuelto**. Podés ver el estado de tus reportes anteriores en la misma sección.

---

## 13. Plan gratuito vs. Pro

### Período de prueba

Al crear tu cuenta, comenzás con un **período de prueba gratuito** que te da acceso completo a todas las funciones de CoinDev. Durante este período verás un banner que indica cuántos días te quedan.

### Plan Pro

El Plan Pro es el acceso completo y sin restricciones a CoinDev. Para activarlo:

1. Hacé clic en el banner de prueba o buscá el botón de **Upgrade** en la app.
2. Te redirige al checkout seguro de LemonSqueezy.
3. Completá el pago.
4. Tu cuenta se activa como Pro automáticamente.

### ¿Qué pasa cuando termina el período de prueba?

Actualmente el sistema muestra el banner informativo durante el período de prueba. El administrador puede gestionar manualmente los planes desde el panel de administración. Para consultas sobre tu plan, usá la función de **Reportar / Consulta** y lo atendemos directamente.

---

## 14. Preguntas frecuentes

### ¿Mis datos son seguros?

Sí. CoinDev usa Supabase con Row Level Security (RLS) activo: cada usuario solo puede ver y modificar sus propios datos. Las conexiones son siempre cifradas (HTTPS). Nunca almacenamos contraseñas en texto plano — Supabase Auth usa hashing bcrypt.

### ¿Puedo usar CoinDev en mi celular?

Sí. CoinDev es una web app completamente responsive, optimizada para móvil. En dispositivos iOS y Android podés agregarla a la pantalla de inicio (PWA) para una experiencia similar a una app nativa:
- **iOS (Safari):** tocá el ícono de compartir → "Agregar a pantalla de inicio"
- **Android (Chrome):** tocá los tres puntos → "Agregar a pantalla de inicio" o "Instalar app"

### ¿En qué moneda se guardan los datos?

Cada cuenta tiene su propia moneda (CRC o USD). Los movimientos se guardan en la moneda de la cuenta. Para comparaciones entre monedas, la app usa el tipo de cambio registrado al momento del movimiento.

### ¿Qué pasa si borro una cuenta?

La cuenta queda desactivada (soft delete). Todos tus movimientos históricos de esa cuenta se conservan en la base de datos, pero la cuenta deja de aparecer en el balance y en los selectores. No podés volver a activarla desde la app — si fue un error, escribinos.

### ¿Puedo registrar movimientos pasados?

Sí. Al crear un movimiento, el campo **Fecha** no está bloqueado al día de hoy — podés elegir cualquier fecha pasada para registrar movimientos que olvidaste ingresar.

### ¿Por qué el saldo de mi cuenta no cuadra?

Las posibles causas:
1. **Saldo inicial incorrecto** — cuando creaste la cuenta, el saldo inicial no reflejaba el saldo real. Editá la cuenta para corregirlo.
2. **Movimientos duplicados** — verificá en el historial si ingresaste el mismo movimiento dos veces.
3. **Transferencias** — asegurate de haber registrado la transferencia como tipo "Transferencia" (no como ingreso + gasto por separado).

### ¿Cómo funciona la conversión de moneda en las metas?

Cuando abonás a una meta desde una cuenta con moneda diferente (ej: cuenta en USD → meta en CRC), la app te muestra primero el monto convertido usando el tipo de cambio en tiempo real y te pide confirmación antes de aplicar el abono.

### ¿Puedo exportar mis datos?

La exportación de datos en CSV está en el roadmap de mejoras. Por ahora, los datos están disponibles en los reportes dentro de la app.

### ¿Cómo recupero mi contraseña?

En la pantalla de inicio de sesión, tocá **¿Olvidaste tu contraseña?**, ingresá tu correo y recibirás un enlace para restablecerla.

### La app muestra datos en inglés aunque tengo el idioma en español

Revisá la configuración: abrí el panel de Configuración → Preferencias → **Idioma** → seleccioná **Español**. Los cambios se aplican al instante sin recargar la página.

### ¿Cómo contacto al soporte?

Usá la función **Reportar problema / Consulta** dentro de la app. Es la forma más rápida — el reporte llega directamente al panel de administración con tu información de cuenta, lo que permite darte una respuesta personalizada.

---

*Manual actualizado: mayo 2026 — CoinDev v1.0*
