# Ajustes al diseño + Plan de implementación paso a paso

---

## 1. Ajustes al diseño a partir de tu feedback

### 1.1 Guiones generados por IA (además del guión manual)

Hoy el guión lo escribe tu equipo (como el Word de VELIA). Lo que propones es que, para clínicas nuevas o servicios nuevos, la IA pueda **generar un primer borrador de guión**, siempre que tenga suficiente contexto. Esto se resuelve con un módulo de **"Generador de Guión"** que recibe:

| Input | Ejemplo |
|---|---|
| Público objetivo | edad, género, ciudad, nivel socioeconómico, intereses |
| Servicio y propuesta de valor | qué es, precio, diferenciadores, duración del efecto |
| Preguntas y respuestas del formulario | las mismas que ya usan en Meta Lead Ads, para anclar vocabulario real de los leads |
| Banco de objeciones ya identificado (si existe) | igual que la sección 6 del guión de VELIA |
| Tono de marca | nombre del "agente" (ej. Yazmín), formal/cercano, uso de emojis |
| Reglas de negocio | horarios, precio de evaluación, ubicación, política de pago |
| **Conversaciones reales exitosas** (few-shot) | los chats que ya tienes son oro para esto — la IA aprende el estilo que *sí* convierte, no un estilo genérico de manual de ventas |

**Salida:** un borrador de guión con la misma estructura que ya usas (apertura, caliente/tibio/frío, objeciones, recordatorios, retargeting), que **un humano revisa y aprueba antes de activarlo**. Nunca se publica un guión generado por IA sin revisión — solo acelera el primer borrador, igual que ya hace tu equipo pero partiendo de una base en vez de la hoja en blanco.

Esto también responde a tu punto de que **recolectar datos es necesario**: cada conversación etiquetada con su resultado (agendó / no agendó / compró) alimenta un módulo adicional de **Insights y Proyecciones**:
- Qué público objetivo convierte mejor por servicio y por clínica.
- Qué campañas/anuncios generan leads de mejor calidad (no solo más baratos).
- Proyección de cuántos leads se necesitan para una meta de ventas dada.
- Recomendación de dónde subir presupuesto y dónde pausar — con datos reales, no intuición.

### 1.2 Evaluación previa por servicio (regla configurable)

Confirmo que la lógica que describes se puede modelar con dos campos nuevos en la entidad **Servicio**:

| Campo | Función |
|---|---|
| `requiere_evaluacion_previa` (booleano) | Si es `true` (ej. Bótox, cualquier inyectable) → el sistema agenda primero la evaluación. Si es `false` (ej. limpieza facial) → agenda el servicio directo, sin paso intermedio |
| `precio_evaluacion` | Monto de la evaluación (S/50 por defecto, editable por clínica) |
| `evaluacion_descontable` (booleano) | Si es `true`, ese monto se resta del precio final cuando el paciente inicia tratamiento |

Con esto, el bot sabe automáticamente qué flujo de conversación usar (evaluación vs. reserva directa) y qué precio cotizar, sin que nadie tenga que programarlo a mano por cada servicio nuevo.

### 1.3 Datos para agendar (confirmado) vs. Ficha de control (nueva)

Confirmado: para **agendar** solo se piden los 6 datos que ya usan — Nombre, Motivo de consulta, Celular, Fecha, Hora, Doctor(a). Eso queda igual, es la entidad `Cita` que ya tenía en el modelo.

Lo nuevo es la **Ficha de Control**, que se llena *en el consultorio* — separada de la cita, con más profundidad. Basado en lo que suelen pedir clínicas estéticas (y en lo que ya intuyes que falta: "marcar si hay fecha de post control para generar mensajes"), propongo esta estructura, como plantilla configurable por clínica (algunos campos fijos, otros específicos por tratamiento):

**Identificación**
- Documento de identidad, fecha de nacimiento, dirección, correo (opcional)

**Historia clínica (anamnesis)**
- Alergias (medicamentos, anestésicos)
- Enfermedades relevantes (diabetes, coagulación, autoinmunes, herpes activo)
- Medicación actual (ej. anticoagulantes)
- Embarazo / lactancia
- Tratamientos estéticos previos (tipo, fecha, resultado)
- Cirugías previas en la zona a tratar

**Consentimiento**
- Consentimiento informado (firma/aceptación digital)
- Autorización de uso de fotos/video con fines de marketing — ya lo piden en sus campañas de sorteo ("¿Aceptas ser grabada?"), aquí queda formalizado por paciente, no solo por campaña

**Datos del tratamiento aplicado**
- Servicio realizado, doctor(a) responsable
- Producto/marca y **número de lote** (Bótox vs. Nabota, como ya diferencian)
- Unidades/dosis aplicadas, zonas tratadas, técnica
- Fecha/hora de aplicación, observaciones del doctor

**Seguimiento (el punto que mencionas)**
- Reacciones adversas inmediatas
- Indicaciones post-tratamiento entregadas
- **Fecha de próximo control** → este campo es el que dispara automáticamente la secuencia de recordatorios de control que ya usan manualmente (como en los chats de Esther y Marleny)
- Resultado del control (satisfactorio / requiere retoque / nueva evaluación)
- Fotos antes/después vinculadas al lead

**Comercial**
- Monto cobrado, forma de pago
- Cross-sell sugerido/aceptado (IPL, limpieza facial, como ya identificaste que funciona)

Esta ficha vive en la entidad `FichaControl`, ligada al `Lead` y a la `Cita` de evaluación — así toda la historia del paciente queda conectada, no en un Excel aparte.

### 1.4 Rentabilidad: mantener el margen simple + automatizar lo demás

Como comenté arriba: dejamos el input manual como está hoy (margen % por servicio), y el sistema complementa automáticamente con costo por lead y conversión real por campaña. No se le pide nada adicional a la clínica.

---

## 2. Plan de implementación — paso a paso

### Etapa 0 — Preparación (antes de escribir código)
1. **Elegir la clínica piloto** → VELIA, porque ya tienes datos reales, guión maduro y el proceso mapeado.
2. **Definir el alcance exacto del MVP** con el cliente: qué se automatiza primero (recomiendo: captación + primer contacto + agenda) y qué se queda manual un tiempo más (ej. ficha de control, en fase 2).
3. **Levantar accesos e integraciones necesarias:**
   - Cuenta de Meta Business + permisos de Lead Ads API sobre las campañas de VELIA.
   - WhatsApp Business Platform: decidir Meta Cloud API directa vs. un BSP (360dialog/Twilio) — esto define tiempos de aprobación, así que se gestiona en paralelo desde ya.
   - Verificación de negocio en Meta (puede tardar días, conviene iniciarla ya).
   - Cuenta de Google Cloud + acceso a Calendar API para los calendarios de las doctoras.
   - API key de Anthropic (Claude) para el motor conversacional.
4. **Migrar el guión de VELIA de Word a un formato estructurado** (JSON/tablas) — es el primer insumo real que carga el sistema, y sirve de plantilla para las próximas clínicas.

### Etapa 1 — Fundaciones técnicas
5. Levantar el repositorio: backend (NestJS + PostgreSQL + Prisma), frontend (React + Vite + TS), infraestructura mínima (Docker + Railway/Render para MVP).
6. Modelar la base de datos con las entidades definidas (Tenant, Usuario, Lead, Conversación, Mensaje, Cita, Servicio con la lógica de evaluación previa, FichaControl, PlantillaGuion, Venta).
7. Auth + estructura multi-tenant desde el inicio (aunque el piloto sea una sola clínica) — así no hay que migrar datos después.

### Etapa 2 — Captación automática
8. Conectar el webhook de Meta Lead Ads → crea el `Lead` en tiempo real con toda la atribución de campaña.
9. Implementar el motor de scoring automático (réplica exacta de la tabla de puntos del guión: caliente/tibio/frío).
10. Panel mínimo tipo Kanban (aunque sea simple al inicio) para ver los leads entrando en vivo — reemplaza el Excel desde este punto.

### Etapa 3 — Motor conversacional
11. Integrar WhatsApp Business API (envío/recepción de mensajes + plantillas para reabrir ventana de 24h).
12. Construir el orquestador de IA con Claude + tools básicas: `consultar_disponibilidad`, `agendar_cita`, `escalar_a_humano`.
13. Cargar el guión migrado de VELIA como la primera `PlantillaGuion` activa (guión humano, no generado por IA todavía — eso viene después de validar el motor base).
14. Probar con tráfico real controlado (ej. 10-20% de los leads nuevos) antes de apagar el proceso manual por completo.

### Etapa 4 — Agenda y seguimiento
15. Integrar Google Calendar (consulta de cupos reales + creación automática de eventos).
16. Automatizar recordatorios (24h / mañana del día / 2h antes) y retargeting (día 15 / día 30 / no-show) con colas programadas.
17. Habilitar la Ficha de Control en el panel para uso del personal en el consultorio, con el campo de "próximo control" conectado a la secuencia de recordatorios.

### Etapa 5 — Inteligencia de negocio
18. Calculadora de rentabilidad: input de margen por servicio + lectura automática de gasto y CPL desde Meta Ads API + conversión real observada.
19. Generación automática de reportes quincenales con link público tokenizado.
20. Módulo de Insights y Proyecciones (según el volumen de datos ya recolectado, ver qué públicos/campañas convierten mejor).

### Etapa 6 — Escalar
21. Activar el Generador de Guión por IA para la siguiente clínica (ya con datos reales de VELIA como referencia de qué "buen guión" produce resultados).
22. Onboarding de nuevas clínicas: configuración de servicios, doctores, horarios y guión base sin tocar código.
23. Ir moviendo cada clínica de "guión 100% manual" a "guión IA + ajuste humano" a medida que se valida.

---

## 3. Por dónde arrancar literalmente la próxima semana

Si tuviera que priorizar las primeras dos semanas de trabajo real, sería:

1. Migrar el guión de VELIA a formato estructurado (paso 4).
2. Levantar el webhook de Meta Lead Ads + scoring automático (pasos 8-9) — esto solo ya elimina el problema más urgente que mencionaste: la demora de +12h en el primer contacto.
3. En paralelo, iniciar el trámite de WhatsApp Business API / verificación de negocio (paso 3), porque es lo que más tiempo de espera externo toma.

Con esos tres frentes en marcha, para la semana 3-4 ya se puede tener el motor conversacional respondiendo leads reales en modo piloto.
