# Scale Management - MVP

Esqueleto inicial para gestionar balanzas por sucursal, con backend y frontend.

## Incluye

- API NestJS con TypeScript
- PostgreSQL con Prisma
- Autenticacion JWT
- Frontend Next.js con login y dashboard
- Roles:
  - `GLOBAL_MANAGER`
  - `BRANCH_MANAGER`
- Ingesta para ESP32 por `deviceId + apiKey`
- Lecturas por sucursal con control de acceso por rol

## Estructura

```text
backend/
  prisma/
  src/
frontend/
  src/
```

## Inicio rapido

### 1) Backend

1. Copiar variables de entorno:

```bash
cd backend
cp .env.example .env
```

2. Levantar PostgreSQL (ejemplo con Docker):

```bash
docker run --name scale-mgmt-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=scale_management \
  -p 5432:5432 -d postgres:16
```

3. Instalar dependencias y preparar DB:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. Ejecutar API:

```bash
npm run start:dev
```

### 2) Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend en `http://localhost:3001` (si 3000 esta ocupado por backend, Next elige puerto libre).

## Credenciales seed

- Global manager:
  - `admin@scale.local`
  - `Admin123!`
- Branch manager:
  - `sucursal.norte@scale.local`
  - `Admin123!`

## Endpoints principales

- `POST /auth/login`
- `GET /branches`
- `GET /readings?branchId=<id>&from=<ISO>&to=<ISO>`
- `GET /readings/comparison?from=<ISO>&to=<ISO>`
- `POST /ingest/weight` (ESP32)
- `GET /alerts/config?branchId=<id>`
- `PUT /alerts/config/branch/:branchId`
- `PUT /alerts/config/scale/:scaleId`

## Frontend MVP

- `/login`:
  - inicia sesion y guarda JWT
- `/dashboard`:
  - gestor global: selector de sucursal
  - gestor de sucursal: sucursal fija segun permisos
  - filtros de fecha/hora
  - estadisticas simples y tabla de lecturas
  - grafico de tendencia de peso con agrupacion por hora/dia
  - comparativa entre sucursales (rol global)
  - alerta de balanza sin reporte reciente (configurable)
  - alerta de pesos fuera de rango (configurable)
  - configuracion de alertas por sucursal y override por balanza

## Ingesta ESP32 (ejemplo)

Headers:

- `x-device-id: SCALE-001`
- `x-device-key: devkey-001`

Body:

```json
{
  "timestamp": "2026-02-20T14:00:00.000Z",
  "weight": 12.4,
  "battery": 91.2,
  "status": "OK"
}
```

## Deploy en Render (Starter)

Este repo incluye Blueprint en `/render.yaml`.

Pasos:

1. Subir el repo a GitHub.
2. En Render: `New +` -> `Blueprint`.
3. Seleccionar el repo y crear recursos.
4. Verificar variable `NEXT_PUBLIC_API_URL` del frontend:
   - debe apuntar al backend real en Render
   - ejemplo: `https://scale-management-backend.onrender.com`
5. Ejecutar seed una sola vez (Render Shell del backend):

```bash
npm run prisma:seed
```

Credenciales de prueba:

- `admin@scale.local` / `Admin123!`
- `sucursal.norte@scale.local` / `Admin123!`
