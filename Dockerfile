# Backend (apps/api) — build en un monorepo con npm workspaces.
# El frontend (apps/web) no se construye aquí; se despliega aparte (Vercel/Netlify/otro servicio de Railway).
FROM node:20-alpine AS build

# Prisma necesita OpenSSL para su query engine — Alpine no lo trae por defecto.
RUN apk add --no-cache openssl

WORKDIR /app

# npm workspaces necesita ver el package.json de cada workspace para instalar
# correctamente (aunque solo vayamos a construir apps/api).
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY . .

RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=apps/api

ENV NODE_ENV=production
EXPOSE 3000

# migrate deploy aplica las migraciones pendientes de forma segura para producción
# (a diferencia de `migrate dev`, no genera migraciones nuevas ni hace preguntas).
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/src/main.js"]
