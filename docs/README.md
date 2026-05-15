# CriticaCi-v2 — Documentación General

Sistema backend de gestión y carga de datos para la empresa de servicios públicos **CENS**. Permite subir archivos Excel de lecturas de medidores y tiempos, importar catálogos (empleados, clientes, medidores, revisiones), y exponer una API REST consumida por el frontend `frontCritica`.

---

## Tabla de contenidos

1. [Arquitectura general](#arquitectura-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura de carpetas](#estructura-de-carpetas)
4. [Variables de entorno](#variables-de-entorno)
5. [Arranque del servidor](#arranque-del-servidor)
6. [Flujo principal de datos](#flujo-principal-de-datos)
7. [Roles y autenticación](#roles-y-autenticación)
8. [Documentos relacionados](#documentos-relacionados)

---

## Arquitectura general

```
frontCritica  ──►  CriticaCi-v2 (Express API)  ──►  MySQL (clientesCI)
  (React)            Puerto 3005/3033                  BD principal
```

- El **frontend** (`frontCritica`) consume esta API con JWT en el header `Authorization: Bearer <token>`.
- El **backend** expone endpoints REST organizados por dominio.
- La **base de datos** MySQL almacena lecturas, empleados, clientes, medidores y revisiones.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 20 (ES Modules) |
| Framework | Express 5 |
| Base de datos | MySQL 8 (mysql2) |
| Autenticación | JWT (jsonwebtoken) + bcrypt |
| Excel | ExcelJS |
| Vistas internas | EJS (gestión de archivos) |
| Proceso | PM2 (nombre: `ServerViernes`) |

---

## Estructura de carpetas

```
CriticaCi-v2/
├── src/
│   ├── connection/         # Pool de conexión MySQL
│   ├── controllers/        # Lógica de cada endpoint
│   ├── middleware/         # Auth, asyncHandler, errorHandler
│   ├── routes/             # Definición de rutas Express
│   ├── services/           # Lógica de negocio y acceso a DB
│   ├── schemas/            # Scripts SQL de creación de tablas
│   ├── views/              # Vistas EJS (gestión interna de archivos)
│   ├── fileJson/           # JSONs intermedios generados
│   ├── data/               # Archivos Excel de catálogos
│   └── server.js           # Entry point
├── scripts/                # Utilidades de conversión
├── fotoEmpleados/          # Fotos de empleados (por cédula)
├── filesTiempos/           # Excel de tiempos subidos
└── docs/                   # Esta documentación
```

---

## Variables de entorno

Archivo `.env` en la raíz del proyecto:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `MYSQL_HOST` | Host de MySQL | `localhost` |
| `MYSQL_USER` | Usuario MySQL | `criticaci` |
| `MYSQL_PASSWORD` | Contraseña MySQL | — |
| `MYSQL_DB` | Nombre de la base de datos | `clientesci` |
| `MYSQL_CONN_LIMIT` | Límite de conexiones del pool | `1000` |
| `PORT` | Puerto del servidor | `3005` |
| `NODE_ENV` | Entorno | `development` |
| `BASE_URL` | URL pública del servidor | `https://server.asolounbit.com` |
| `JWT_SECRET` | Clave para firmar tokens JWT | — |
| `JWT_EXPIRES_IN` | Duración del token de auth | `1h` |
| `TEMP_TOKEN_EXPIRES_IN` | Duración del token temporal | `15m` |
| `BATCH_SIZE` | Registros por lote en inserts | `1000` |

---

## Arranque del servidor

```bash
# Desarrollo
npm run dev

# Producción (PM2)
pm2 start src/server.js --name ServerViernes
pm2 restart ServerViernes --update-env   # para recargar .env
pm2 logs ServerViernes                   # ver logs en tiempo real
pm2 save                                 # guardar lista de procesos
```

---

## Flujo principal de datos

### 1. Subida de archivos

El usuario sube un Excel a través de la vista web `/files/data` o `/files/times`. Los archivos van a:
- `src/data/` → catálogos (empleados, clientes, medidores, revisiones…)
- `filesTiempos/` → lecturas de tiempos de operarios

### 2. Ejecución (botón Run)

Desde la vista de archivos se selecciona el tipo y se ejecuta. Cada tipo llama a su endpoint:

| Tipo | Endpoint |
|------|----------|
| `empleados` | `POST /api/empleados/importar` |
| `medidores` | `POST /api/medidores/load` |
| `tiempos` | `POST /api/load` |
| `clientes` | `POST /api/data/load` (target: clientes) |
| `clientesSac` | `POST /api/data/load` (target: clientessac) |
| `tipofactura` | `POST /api/data/load` (target: tipofacturacion) |
| `revisiones` | `POST /api/data/load` (target: revisiones) |
| `correria` | `POST /api/data/load` (target: correria) |
| `revisionesSac` | `POST /api/data/load` (target: revisionessac) |
| `revisionesSirius` | `POST /api/data/load` (target: revisionessirius) |

### 3. Empleados — validación de duplicados

Al importar empleados, el sistema:
1. Parsea el Excel (columnas: `Sede`, `Cedula`, `Nombre`, `Cargo`)
2. Consulta la DB para identificar cédulas ya existentes
3. Inserta **solo los registros nuevos** (no hace update de existentes)
4. Regenera `src/fileJson/empleados.json` para uso interno
5. Retorna: `{ insertados, duplicados, totalLeidas }`

---

## Roles y autenticación

### Flujo de login

1. `POST /api/auth/validate-cedula` → verifica si la cédula existe y si tiene contraseña temporal o definitiva
2. `POST /api/auth/validate-temp-password` → valida contraseña temporal → devuelve token temporal (15 min)
3. `POST /api/auth/change-password` → cambia contraseña → devuelve token de auth (1h)
4. `POST /api/auth/login` → login normal con contraseña definitiva → devuelve token de auth

### Mapa de roles (por `cargo` en la tabla `empleados`)

| Cargo en DB | Rol en token |
|-------------|-------------|
| `TECNOLOGO CGO` | `ADMIN` |
| `TECNÓLOGO(Supervísor)` | `SUPERVISOR` |
| `PROFESIONAL 3 CALIDAD` | `PRO_CALIDAD` |
| `PROFESIONAL` | `PROFESIONAL` |
| `OPERATIVO 1 / 2 / 3` | `BASICO` |
| Cualquier otro | `BASICO` |

### Validación de perfil en revisiones

En `revisiones.service.js`, al responder una consulta de revisiones, el sistema consulta el `cargo` del usuario en la tabla `empleados`:
- Si es `OPERATIVO 1 / 2 / 3` → devuelve `dataRevisionesPerfilOperativo` (campos reducidos)
- Cualquier otro cargo → devuelve `dataRevisiones` (todos los campos)

---

## Documentos relacionados

| Documento | Descripción |
|-----------|-------------|
| [API.md](API.md) | Referencia completa de todos los endpoints |
| [DATABASE.md](DATABASE.md) | Esquema de tablas y relaciones |
