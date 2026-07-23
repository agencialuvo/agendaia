# Sistema de Automatización Comercial con IA para Clínicas Estéticas
## Análisis completo y arquitectura técnica propuesta

---

## 1. Entendimiento del problema (basado en el material analizado)

Revisé los 5 insumos que compartiste:

1. **`requerimientos_del_cliente.txt`** — el brief funcional completo.
2. **`Guión de venta - VELIA`** — el "cerebro" comercial: scoring de leads, reglas de horario, 4 guiones de primer contacto, manejo de objeciones, recordatorios, retargeting y post-venta.
3. **14 chats reales de WhatsApp** — cómo Yazmín ejecuta ese guión en la práctica (con desvíos, errores humanos y casos límite).
4. **3 capturas de Kommo** — el estándar de UX que ya conocen y quieren igualar/superar (Kanban, Calendario, lista de Leads).
5. **3 Excel + 1 CSV** — cómo capturan datos hoy: export crudo de Meta Lead Ads + columnas manuales de seguimiento por fecha, y un boceto de modelo de datos propio (`Muestra_de_BD.xlsx`).

**Diagnóstico del proceso actual:**

- El lead entra por Meta Lead Ads → cae a un Excel enlazado → un humano lo lee, lo puntúa mentalmente y escribe por WhatsApp. Latencia real observada en tu propio Excel: *"Se le llamo no contesta / se le volvió a escribir"* repetido en varias columnas de fecha — es decir, el seguimiento se hace a mano, día por día, en celdas de texto libre. Esto **no escala** y es la causa directa de las +12h de demora que mencionas.
- El guión SÍ está bien diseñado (puntuación 0-7, ramas caliente/tibio/frío, reglas de horario dinámicas, objeciones documentadas) — el problema no es "qué decir", es que **nadie lo ejecuta 24/7 de forma consistente**. Los chats reales muestran a Yazmín aplicándolo bien, pero con huecos de horas/días entre mensajes (ej. el chat de +51 943 617 253 queda con la cita sin hora confirmada por más de 24h).
- El campo `lead_status` en tus Excel siempre está en `CREATED` — no hay una máquina de estados real, solo notas de texto.
- Ya tienes un patrón de campañas de "sorteo/grupo de WhatsApp" (chats de +51 913 154 800, +51 970 334 883, +51 908 023 296) que es un **flujo distinto** al de formulario directo — el sistema debe soportar múltiples tipos de flujo de entrada, no solo uno.
- Tu boceto `Muestra_de_BD.xlsx` (Usuario, Clínica, Servicio, Paciente) es un buen punto de partida pero le faltan las entidades centrales del negocio: **Lead, Conversación, Mensaje, Cita, Campaña, Score, Reporte** — las detallo en la sección 6.

Con eso como base, esto es lo que propongo construir.

---

## 2. Visión del producto

Una **plataforma SaaS multi-clínica** (una agencia, muchos clientes/clínicas) con cuatro capas:

| Capa | Qué hace |
|---|---|
| **Captación** | Ingiere leads de Meta Lead Ads (webhook en tiempo real, ya no Excel) y mensajes orgánicos de WhatsApp |
| **Conversación con IA** | Un motor conversacional que ejecuta el guión de ventas de forma dinámica según el scoring y el historial, con function-calling para agendar, consultar disponibilidad y escalar a humano |
| **Gestión (CRM)** | Kanban tipo Kommo, calendario sincronizado con Google Calendar, ficha de lead con línea de tiempo real (no columnas de fecha manuales) |
| **Inteligencia de negocio** | Scoring automático, calculadora de rentabilidad/breakeven por clínica, reportes quincenales autogenerados con link público, y analítica de mejora del formulario |

---

## 3. Stack tecnológico

### 3.1 Frontend — **React** (requisito confirmado)

| Elemento | Elección | Por qué |
|---|---|---|
| Framework | **React 18/19 + TypeScript + Vite** | Vite da HMR rápido y build liviano; TS es obligatorio en un CRM con muchos modelos de datos (evita bugs de forma silenciosa) |
| Estilos / UI kit | **Tailwind CSS + shadcn/ui** | Componentes accesibles, headless, fáciles de theming por clínica (whitelabel) |
| Data fetching / cache | **TanStack Query (React Query)** | Los leads y conversaciones cambian en tiempo real; necesitas invalidación y refetch inteligente |
| Estado global | **Zustand** | Más liviano que Redux para estado de UI (filtros, panel activo, usuario) |
| Kanban drag & drop | **@dnd-kit** | Reemplaza a `react-beautiful-dnd` (descontinuado); accesible y con buen rendimiento en listas largas como tu "Todos los leads" |
| Calendario | **FullCalendar (React wrapper)** o **react-big-calendar** | Vista día/semana/mes idéntica a la que ya usas en Kommo (imagen 1) |
| Gráficos / reportes | **Recharts** | Para el dashboard de rentabilidad y reportes quincenales |
| Formularios | **React Hook Form + Zod** | Validación tipada para fichas de lead, configuración de guiones por clínica, etc. |
| Tiempo real | **Socket.io-client** | Para que el inbox de chat (como "Inbox de chat" de Kommo) se actualice en vivo cuando llega un WhatsApp o el bot responde |

### 3.2 Backend

| Elemento | Elección | Por qué |
|---|---|---|
| Runtime / framework | **Node.js + NestJS (TypeScript)** | Mismo lenguaje que el frontend (equipo único), arquitectura modular (un módulo por dominio: leads, conversaciones, citas, campañas, reportes), soporte nativo de WebSockets y colas |
| Base de datos | **PostgreSQL** | Relacional, soporta bien multi-tenant (esquema por tenant o `tenant_id` + Row-Level Security), y JSONB para guardar respuestas de formulario variables por clínica |
| ORM | **Prisma** | Migraciones tipadas, ideal con NestJS + TS |
| Cache / colas | **Redis + BullMQ** | Colas para: recordatorios programados (24h/2h antes), retargeting (día 15/30), reintentos de envío WhatsApp, generación de reportes |
| Tiempo real | **Socket.io (server)** | Notifica al panel cuando la IA necesita intervención humana (handoff) |
| Motor de IA conversacional | **Claude (Anthropic API) vía SDK oficial**, con **tool use / function calling** | Permite que el modelo invoque acciones estructuradas (`consultar_disponibilidad`, `agendar_cita`, `escalar_a_humano`, `enviar_media`) en vez de "alucinar" horarios o inventar datos — esto es clave para que la IA "no sea un bot que no entiende el contexto", como pides |
| Almacenamiento de media | **S3-compatible (AWS S3 / Cloudflare R2)** | Para los videos de testimonios y audios personalizados que ya usan (ej. video de Lisbeth, audios de la Dra. Jhoana) |
| Autenticación | **JWT + roles (RBAC)** | Roles: `admin_agencia`, `agente`, `dueño_clinica` (solo ve sus reportes) |

### 3.3 Integraciones externas

| Integración | Uso |
|---|---|
| **Meta Graph API — Lead Ads Webhooks** | Reemplaza el Excel enlazado: el lead llega al sistema en segundos, no cuando alguien revisa la hoja |
| **Meta Marketing API** | Para leer costo por lead, gasto por campaña/anuncio y así alimentar la calculadora de rentabilidad automáticamente |
| **WhatsApp Business Platform (Cloud API de Meta)**, directo o vía un BSP tipo **360dialog / Twilio** | Envío/recepción de mensajes, plantillas (HTML aprobadas) para reabrir la ventana de 24h en recordatorios |
| **Google Calendar API** | Verifica cupos reales antes de que la IA ofrezca un horario y crea el evento automáticamente al confirmar |
| **Anthropic API (Claude)** | Motor conversacional + generación de insights narrativos en los reportes quincenales |

### 3.4 Infraestructura

- **Contenedores Docker** por servicio (api, worker de colas, ws-gateway).
- MVP: **Railway / Render / Fly.io** (rápido de desplegar, barato). Escalado: **AWS ECS/EKS o GCP Cloud Run** cuando haya varias clínicas con volumen alto.
- **CI/CD**: GitHub Actions (test → build → deploy).
- **Observabilidad**: Sentry (errores) + logs estructurados; dashboard simple de "salud del bot" (mensajes sin responder, tasa de handoff a humano).

---

## 4. Módulos funcionales

### 4.1 Ingesta y scoring automático de leads
- Webhook de Meta Lead Ads crea el `Lead` en tiempo real con toda la atribución (`campaign_name`, `adset_name`, `ad_name`, `platform`, `is_organic` — datos que ya vienen en tus CSV/Excel).
- Un **motor de reglas configurable por clínica** replica exactamente la tabla de puntos de tu guión (semana=3, próxima semana=2, indíquenme=1; pago sí=2/no=0; asiste sí=2/no=0) y calcula automáticamente **Caliente / Tibio / Frío**.
- Para leads que entran por WhatsApp orgánico (sin formulario, como el chat de +51 967 524 271 que llegó "vi su perfil en Instagram"), el bot ejecuta la **apertura diagnóstica** (sección 5 del guión) para inferir el mismo score conversacionalmente.

### 4.2 Motor conversacional de IA (el corazón del sistema)
Arquitectura del flujo por cada mensaje entrante de WhatsApp:

```
WhatsApp → Webhook → Cola (BullMQ) → Orquestador
   ↓
Construye contexto: datos del formulario, score, etapa del funnel,
historial de conversación, guión/objeciones de ESA clínica
   ↓
Llamada a Claude con tools disponibles:
  - consultar_disponibilidad(fecha)
  - agendar_cita(fecha, hora)
  - actualizar_score(...)
  - enviar_media(tipo_objecion)
  - escalar_a_humano(motivo)
   ↓
Ejecuta tool calls (ej. valida horario real en Google Calendar)
   ↓
Envía respuesta por WhatsApp + actualiza Kanban + log de conversación
```

**Reglas duras (guardrails), no delegadas al modelo:**
- La IA **nunca calcula horarios de memoria** — siempre usa la tool de disponibilidad (así se implementa en código la regla de sección 1 del guión: próximo día hábil + el siguiente, corte a las 6pm, domingo con abono especial).
- La IA **nunca da indicaciones médicas** más allá de lo que ya está en el guión de objeciones — cualquier pregunta clínica que salga del script conocido dispara `escalar_a_humano`.
- Si el lead expresa molestia, pide hablar con una persona, o el modelo tiene baja confianza → **handoff inmediato**: el bot se pausa para ese lead, se notifica en tiempo real al panel (igual que el ícono de notificaciones de Kommo) y un humano retoma sin que el bot vuelva a escribir hasta que el agente lo reactive.
- Variantes A/B de cada guion (como ya haces manualmente, "Variante A / Variante B") para no sonar repetitivo — el sistema alterna automáticamente.

### 4.3 CRM tipo Kanban + Inbox (inspirado en tus capturas de Kommo)
Etapas por defecto (ampliables por clínica):

`Leads entrantes → Nuevo lead → Contactado → Agendado → Confirmado → Atendido / No-show → Control → Perdido`

- Cambio de etapa **automático** (cuando la IA agenda, mueve el lead solo) o manual (arrastrar y soltar con `@dnd-kit`), igual que pediste.
- Ficha de lead con **línea de tiempo real** (reemplaza las columnas de fecha manuales de tu Excel: *"se le llamó a las 4", "se le volvió a escribir"*) — cada intento de contacto, respuesta, cambio de etapa y nota queda registrado automáticamente con timestamp y autor (bot o humano).
- Inbox de chat en vivo con WebSockets, como el "Inbox de chat" de Kommo.

### 4.4 Agenda inteligente
- Sincronización bidireccional con **Google Calendar** por clínica (o por doctor, ej. Dra. Jhoana Infante / Dr. Jefferson Villegas — vi que ya diferencias por especialista en los chats).
- Antes de ofrecer un horario, el sistema consulta cupos reales; nunca ofrece un slot ocupado.
- Recordatorios automáticos vía colas programadas: 24h antes, mañana del día, 2h antes — tal como en la sección 8 del guión, sin que nadie tenga que acordarse de enviarlos.

### 4.5 Retargeting y post-venta automatizados
- Reglas temporizadas (BullMQ + cron): día 15 sin respuesta, día 30 sin respuesta, no-show del día, liberación de cupo tras 2do intento — todo esto ya está en tu guión, solo falta que se dispare solo.
- Post-visita: solicitud de reseña (Google/Facebook, como ya haces) + cross-sell sugerido por IA según el servicio recibido (ej. IPL, limpieza facial, como ya identificaste que funciona bien).

### 4.6 Calculadora de rentabilidad y meta de conversión
Basado en el ejemplo que diste (VELIA: Bótox S/1200 y Nabota S/900, el cliente te paga S/3000/mes, gasta S/800 en publicidad):

- Cada clínica configura: sus servicios y precios, el % de margen real de cada uno, cuánto te paga a ti (la agencia) y su presupuesto de ads mensual.
- El sistema calcula automáticamente **cuántas evaluaciones y cuántas ventas cerradas se necesitan** para que la clínica sea rentable y para que tu fee esté justificado, y lo recalcula en vivo según la tasa de conversión real observada (lead→cita→venta) por etapa del Kanban — ya no es un cálculo manual que "toma mucho tiempo".
- Dashboard de embudo: cuántos leads entraron, cuántos se contactaron en <2h, cuántos agendaron, cuántos asistieron, cuántos compraron — con el cuello de botella resaltado.

### 4.7 Reportes automáticos (día 15 y fin de mes)
- Generados sin intervención humana, con narrativa (usando IA para redactar el resumen ejecutivo) + gráficos (Recharts).
- Publicados en una **URL única y tokenizada** por reporte y por clínica (sin login, con expiración) — así cada clínica ve *solo* su análisis, como pediste.
- Exportable a PDF si el cliente lo quiere.

### 4.8 Analítica de mejora del formulario
- Cruza las respuestas del formulario instantáneo con el resultado real (¿ese score terminó en venta o no?), para sugerir ajustes: preguntas que predicen mal, redacciones que generan leads de baja intención, etc. — resolviendo tu pedido de que el sistema también evalúe el formulario, no solo la conversación.

### 4.9 Multi-clínica / multi-tenant
- Cada clínica tiene su propio guión de ventas (mensajes, objeciones, horarios de atención, doctores, servicios) configurable desde un panel — no hardcodeado — para que el mismo sistema sirva a distintas clínicas estéticas, no solo VELIA.

---

## 5. Estados / máquina de estados del lead

```
CREATED (llega de Meta o WhatsApp)
   → PUNTUADO (scoring automático: caliente/tibio/frío)
   → CONTACTADO (IA envía primer mensaje)
   → EN_CONVERSACION (intercambio activo)
   → AGENDADO (cita creada + evento en Google Calendar)
   → CONFIRMADO (24h antes, confirmó asistencia)
   → ATENDIDO | NO_SHOW
   → CONTROL_PROGRAMADO (si aplica, post-tratamiento)
   → GANADO (compró tratamiento) | PERDIDO (archivado con cortesía)
   → EN_RETARGETING (si quedó frío o sin respuesta 15/30 días)
```
Cada transición puede requerir intervención humana si la confianza del modelo es baja (`REQUIERE_HUMANO` como sub-estado transversal).

---

## 6. Modelo de datos (entidades núcleo)

Partiendo y ampliando tu boceto `Muestra_de_BD.xlsx` (Usuario, Clínica, Servicio, Paciente):

| Entidad | Campos clave | Nota |
|---|---|---|
| **Tenant / Clinica** | nombre, dirección, horarios de atención, doctores, canal WhatsApp asociado | multi-tenant desde el día 1 |
| **Usuario** | rol (admin/agente/dueño), clínicas asociadas | |
| **Servicio/Plan** | nombre, precio, % margen real, plan (básico/medio/premium) | alimenta la calculadora de rentabilidad |
| **Campana / Anuncio** | id de Meta, nombre, presupuesto, plataforma (fb/ig), orgánico o pagado | atribución completa |
| **Lead** | datos del formulario (JSONB, flexible por clínica), teléfono, nombre, score, etapa actual, origen | reemplaza tus filas de Excel |
| **Conversacion** | lead_id, canal (whatsapp), estado (bot/humano) | |
| **Mensaje** | conversacion_id, remitente, texto/media, timestamp, generado_por (IA/humano) | **reemplaza las columnas de fecha manuales** — esto es la mejora más importante frente a tu proceso actual |
| **Cita** | lead_id, fecha, hora, doctor, tipo (evaluación/control), estado, evento_google_calendar_id | |
| **ObjecionRespuesta** | clínica_id, disparador, respuesta, media_asociada | tu sección 6 del guión, configurable |
| **PlantillaGuion** | clínica_id, tipo (caliente/tibio/frío/apertura/recordatorio/retargeting), variantes A/B | el guión ya no vive en un Word, vive en la BD |
| **ReporteAnalisis** | clínica_id, periodo, métricas, link_publico_token | |
| **Venta** | lead_id, servicio_id, monto, fecha | cierra el loop para la calculadora de rentabilidad |

---

## 7. Roadmap sugerido

| Fase | Alcance | Objetivo |
|---|---|---|
| **1 — MVP (4-6 semanas)** | 1 clínica (VELIA), webhook de Meta Lead Ads, bot de WhatsApp con scoring + guión caliente/tibio/frío, Kanban básico, agenda con Google Calendar | Reemplazar el proceso manual actual y bajar el tiempo de primer contacto a minutos |
| **2 — CRM completo** | Multi-tenant, recordatorios y retargeting automáticos, línea de tiempo de conversación, handoff a humano en tiempo real | Igualar y superar la funcionalidad de Kommo que ya usan |
| **3 — Inteligencia de negocio** | Calculadora de rentabilidad, reportes quincenales con link público, dashboard de embudo | Automatizar lo que hoy calculan a mano |
| **4 — Optimización continua** | Analítica de mejora del formulario, A/B testing de guiones, ampliar a más canales (Instagram DM, TikTok Ads) | Escalar a más clínicas con mínima config adicional |

---

## 8. Riesgos y consideraciones a resolver con el cliente

- **Política de WhatsApp Business**: los recordatorios fuera de la ventana de 24h requieren plantillas pre-aprobadas por Meta — hay que diseñarlas y mandarlas a aprobación antes de lanzar.
- **Datos de salud**: el sistema maneja datos sensibles (tratamientos estéticos, fotos de pacientes) — conviene revisar la Ley de Protección de Datos Personales de Perú (Ley N.º 29733) para consentimientos y almacenamiento.
- **Límite de la IA en temas médicos**: la IA debe ceñirse estrictamente al guión comercial y nunca dar indicaciones clínicas — cualquier pregunta médica específica se escala a la doctora.
- **Dependencia de Meta**: cambios en la API de Lead Ads o en las políticas de WhatsApp Business pueden requerir ajustes; conviene desacoplar el conector de Meta del núcleo del sistema.
- **Aprobación de plantillas y verificación de negocio (Meta Business Verification)** puede tomar días — es buen punto para arrancar en paralelo a la Fase 1.

---

¿Quieres que profundice en alguno de estos puntos primero — por ejemplo, que te arme el esquema de base de datos completo (tablas y relaciones en SQL), el diagrama de arquitectura visual, o que empecemos por el prompt/sistema de reglas del motor conversacional de IA?
