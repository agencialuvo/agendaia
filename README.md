# VELIA CRM-IA (piloto) — Sistema multi-clínica de captación y ventas con IA

Monorepo con backend (NestJS) y frontend (React), diseñado para arrancar con VELIA
como clínica piloto pero pensado desde el inicio como **multi-tenant** (varias clínicas).

## Estructura del repositorio

```
velia-crm-ia/
├── apps/
│   ├── api/                 # Backend NestJS + Prisma + PostgreSQL
│   │   ├── src/
│   │   │   ├── modules/     # Un módulo por dominio de negocio
│   │   │   │   ├── tenants/         # Clínicas (multi-tenant)
│   │   │   │   ├── auth/            # Login, roles (admin/agente/dueño de clínica)
│   │   │   │   ├── leads/           # Ingesta de leads (Meta Lead Ads + WhatsApp orgánico)
│   │   │   │   ├── scoring/         # Motor de puntaje caliente/tibio/frío
│   │   │   │   ├── conversaciones/  # Mensajes e hilos de WhatsApp
│   │   │   │   ├── citas/           # Agenda (los 6 datos mínimos + Google Calendar)
│   │   │   │   ├── servicios/       # Catálogo de servicios (con lógica de evaluación previa)
│   │   │   │   ├── fichas-control/  # Ficha clínica post-visita
│   │   │   │   ├── whatsapp/        # Integración WhatsApp Business API
│   │   │   │   ├── ia/              # Motor conversacional (Claude + tool use)
│   │   │   │   ├── calendario/      # Integración Google Calendar
│   │   │   │   ├── reportes/        # Reportes quincenales + link público
│   │   │   │   └── ventas/          # Cierre de venta, para la calculadora de rentabilidad
│   │   │   ├── common/       # Guards, interceptors, decorators, filtros compartidos
│   │   │   └── config/       # Configuración tipada (env vars)
│   │   └── prisma/
│   │       └── schema.prisma # Modelo de datos completo
│   │
│   └── web/                 # Frontend React + Vite + TS + Tailwind
│       └── src/
│           ├── pages/
│           │   ├── kanban/     # Embudo de ventas (drag & drop, estilo Kommo)
│           │   ├── calendario/ # Vista de agenda
│           │   ├── leads/      # Lista/ficha de leads
│           │   ├── reportes/   # Dashboard de rentabilidad y reportes quincenales
│           │   └── login/
│           ├── components/
│           ├── hooks/
│           ├── lib/          # Cliente HTTP, cliente de WebSocket
│           ├── store/        # Estado global (Zustand)
│           └── types/
│
├── config/
│   └── guiones/
│       └── velia.json       # Guión de VELIA estructurado (fuente de verdad, v1.1)
│
└── docs/                     # Documentos de arquitectura y plan de implementación
```

## Requisitos previos

- Node.js 20+
- Docker (para PostgreSQL y Redis locales)
- Cuenta de Anthropic (API key de Claude) para el motor conversacional
- Cuentas de Meta Business, WhatsApp Business Platform y Google Cloud (para las integraciones — no son necesarias para levantar el proyecto en local por primera vez)

## Cómo levantar el proyecto en local

```powershell
# 1. Abrir esta carpeta en VS Code / terminal

# 2. Copiar variables de entorno (backend y frontend)
Copy-Item .env.example apps\api\.env      # si apps\api\.env no existe todavía
Copy-Item apps\web\.env.example apps\web\.env
# completar los valores reales en apps\api\.env (credenciales, secretos, etc.)

# 3. Levantar PostgreSQL y Redis
docker compose up -d

# 4. Instalar dependencias (una sola vez, instala los dos workspaces)
npm install

# 5. Preparar la base de datos (solo la primera vez, o tras cambios de esquema)
cd apps\api
npx prisma migrate dev
npx prisma db seed      # crea la clínica VELIA + catálogo + el usuario Admin Master inicial
cd ..\..

# 6. Levantar el backend (déjalo corriendo en esta terminal)
npm run dev:api

# 7. En OTRA terminal, levantar el frontend
npm run dev:web
```

El backend queda en `http://localhost:3000` y el frontend en `http://localhost:5173`.
Inicia sesión con el correo/contraseña definidos en `ADMIN_MASTER_EMAIL` / `ADMIN_MASTER_PASSWORD` de `apps/api/.env` (el seed los crea automáticamente).

## Orden sugerido de desarrollo (según el plan de implementación en /docs)

1. `servicios` — cargar el catálogo desde `config/guiones/velia.json`
2. `leads` + `scoring` — webhook de Meta Lead Ads y motor de puntaje
3. `whatsapp` + `ia` — motor conversacional
4. `citas` + `calendario` — agenda con Google Calendar
5. `fichas-control` — ficha clínica post-visita
6. `ventas` + `reportes` — calculadora de rentabilidad y reportes quincenales

Ver `docs/Plan_de_Implementacion_Paso_a_Paso.md` para el detalle completo de cada etapa.
