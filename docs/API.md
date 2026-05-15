# API Reference — CriticaCi-v2

Base URL: `https://server.asolounbit.com`

Los endpoints marcados con 🔒 requieren header:
```
Authorization: Bearer <authToken>
```

---

## Índice

- [Autenticación](#autenticación)
- [Consultas (tiempos)](#consultas-tiempos)
- [Revisiones](#revisiones)
- [Empleados](#empleados)
- [Archivos y carga de datos](#archivos-y-carga-de-datos)
- [Medidores](#medidores)
- [Clientes](#clientes)
- [Log de consultas](#log-de-consultas)
- [Panel de información](#panel-de-información)
- [Códigos de respuesta](#códigos-de-respuesta)

---

## Autenticación

### Validar cédula
`POST /api/auth/validate-cedula`

Verifica si la cédula existe y qué tipo de login requiere.

**Body:**
```json
{ "cedula": "1004862354" }
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "cedula": "1004862354",
    "name": "Juan Pérez",
    "cargo": "OPERATIVO 1",
    "role": "BASICO",
    "passwordChanged": false,
    "requiresPasswordChange": true,
    "nextStep": "temp-password"
  }
}
```

`nextStep` puede ser `"temp-password"` (primer login) o `"normal-login"`.

---

### Validar contraseña temporal
`POST /api/auth/validate-temp-password`

**Body:**
```json
{ "cedula": "1004862354", "temporaryPassword": "Abc12345" }
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "cedula": "1004862354",
    "temporaryToken": "<jwt>",
    "requiresPasswordChange": true
  }
}
```

---

### Cambiar contraseña
`POST /api/auth/change-password` 🔒 *(token temporal)*

La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.

**Body:**
```json
{ "cedula": "1004862354", "newPassword": "NuevaPass1" }
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "authToken": "<jwt>",
    "cedula": "1004862354",
    "name": "Juan Pérez",
    "cargo": "OPERATIVO 1",
    "role": "BASICO"
  }
}
```

---

### Login normal
`POST /api/auth/login`

**Body:**
```json
{ "cedula": "1004862354", "password": "NuevaPass1" }
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "authToken": "<jwt>",
    "cedula": "1004862354",
    "name": "Juan Pérez",
    "cargo": "OPERATIVO 1",
    "role": "BASICO"
  }
}
```

---

### Cerrar sesión
`POST /api/auth/logout` 🔒

Respuesta: `{ "success": true, "message": "Sesión cerrada exitosamente" }`

---

### Verificar token
`GET /api/auth/verify-token` 🔒

Respuesta:
```json
{
  "success": true,
  "data": {
    "cedula": "1004862354",
    "name": "Juan Pérez",
    "cargo": "OPERATIVO 1",
    "role": "BASICO",
    "lastLogin": "2026-05-11T20:00:00.000Z",
    "tokenValid": true
  }
}
```

---

## Consultas (tiempos)

### Consultar por cliente o medidor
`POST /api/consulta/tiempos` 🔒

Busca en la tabla `tiempos` con fallback automático por mes y año.

**Body (por cliente):**
```json
{ "tipo": "cliente", "cliente": "1170143751", "usuario": "Juan Pérez" }
```

**Body (por medidor):**
```json
{ "tipo": "medidor", "medidor": "7647545", "usuario": "Juan Pérez" }
```

**Respuesta exitosa (cliente):**
```json
{
  "success": true,
  "code": "CONSULTA_OK",
  "data": {
    "cliente": 1170143751,
    "clienteId": 1170143751,
    "tipo": "cliente",
    "mesConsultado": 4,
    "total": 1,
    "registro": { ... },
    "rows": [ ... ]
  }
}
```

**Respuesta exitosa (medidor):**
```json
{
  "success": true,
  "code": "CONSULTA_OK",
  "data": {
    "medidor": "7647545",
    "cliente": "1170143751",
    "clienteId": "1170143751",
    "tipo": "medidor",
    "mesConsultado": 4,
    "total": 1,
    "registro": { ... },
    "rows": [ ... ]
  }
}
```

**Campos enriquecidos en `registro`:**
- `direccion`, `nombre_cliente`, `barrio`, `marca_medidor`
- `transformador`, `alimentador`, `tipo_registrador`
- `ruta_reparto`, `ruta_lectura`
- `tipo_facturacion`, `correo_electronico`
- `lector` (nombre resuelto desde tabla `empleados`)
- `Cliente_anterior_N`, `Cliente_posterior_N` (hasta 5 de cada lado)

**Códigos de error:**

| Code | HTTP | Descripción |
|------|------|-------------|
| `CLIENTE_REQUIRED` | 400 | Falta el campo `cliente` |
| `MEDIDOR_REQUIRED` | 400 | Falta el campo `medidor` |
| `CLIENTE_NO_ENCONTRADO` | 404 | Cliente no existe en ningún mes consultado |
| `MEDIDOR_NO_ENCONTRADO` | 404 | Medidor no existe en ningún mes consultado |
| `TIPO_NO_SOPORTADO` | 400 | `tipo` debe ser `"cliente"` o `"medidor"` |

---

### Consultar historial completo de un cliente
`POST /api/consulta/tiempos/Cl` 🔒

Devuelve todos los registros históricos de un cliente con consumos calculados por mes.

**Body:**
```json
{ "cliente": "1170143751" }
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "cliente": 1170143751,
    "total": 12,
    "rows": [
      {
        "MES": 1, "ANO": 2026, "nombreMes": "Enero",
        "lectura": 1250, "nombreEmpleado": "Juan Pérez",
        "cedulaEmpleado": "1004862354"
      }
    ],
    "consumos": {
      "Enero": { "mes": 1, "lecturaActual": 1250, "lecturaSiguiente": 1300, "consumo": 50 }
    }
  }
}
```

---

### Consultar medidor en SAC
`POST /api/consulta/tiempos/medidorSac` 🔒

**Body:**
```json
{ "medidor": "7647545" }
```

**Respuesta:**
```json
{
  "success": true,
  "data": [ { "Medidor": "7647545", "clienteId": "...", "Direccion": "...", "DEstadoCliente": "..." } ]
}
```

---

### Perfil de lector
`POST /api/consulta/info/perfilLector` 🔒

Estadísticas de lecturas realizadas por un operario.

**Body:**
```json
{ "lector": "1004862354", "orderDir": "DESC" }
```

---

## Revisiones

### Consultar revisiones de un cliente
`POST /api/revisiones/consultar` 🔒

Devuelve revisiones de `clientes_servicios`. Los campos devueltos dependen del `cargo` del usuario:
- **OPERATIVO 1/2/3** → campos reducidos (sin datos técnicos internos)
- **Otros cargos** → todos los campos

**Body:**
```json
{
  "cliente": "467222",
  "usuario": "Juan Pérez",
  "tipoConsulta": "revisiones",
  "detalles": "Consulta desde app"
}
```

**Respuesta (perfil operativo):**
```json
{
  "ok": true,
  "count": 2,
  "rows": [
    {
      "CLIENTE_ID": "467222",
      "NOMBRE": "...",
      "DIRECCION": "...",
      "CICLO": "01",
      "SERIE_I": "...",
      "MARCA_I": "...",
      "NUMERO_REVISION": 123,
      "D_TIPO": "...",
      "FECHA_SOLICITUD": "...",
      "FECHA_REVISION": "...",
      "REVISOR": "...",
      "D_REVISOR": "...",
      "OBSERVACION": "...",
      "D_OBSERVACION": "...",
      "OBSREVISION": "...",
      "TRANSFORMADOR": "..."
    }
  ]
}
```

---

## Empleados

### Importar empleados desde Excel
`POST /api/empleados/importar`

El archivo debe estar en `src/data/`. Solo inserta registros **nuevos** (no actualiza existentes).

**Columnas requeridas en el Excel:** `Sede`, `Cedula`, `Nombre`, `Cargo`

**Body:**
```json
{ "filename": "empleados.xlsx" }
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "success": true,
  "message": "Se insertaron 15 empleados nuevos.",
  "totalLeidas": 202,
  "insertados": 15,
  "duplicados": 187,
  "jsonGenerado": true
}
```

---

## Archivos y carga de datos

### Listar archivos de una carpeta
`GET /api/files`

Devuelve archivos `.xlsx` en `src/data/` o `filesTiempos/`.

---

### Cargar archivo de tiempos
`POST /api/load`

**Body:**
```json
{ "filename": "TIEMPOS_ABRIL.xlsx" }
```

---

### Cargar catálogos (clientes, revisiones, etc.)
`POST /api/data/load`

**Body:**
```json
{ "filename": "clientes.xlsx", "target": "clientes" }
```

Targets disponibles: `clientes`, `clientessac`, `tipofacturacion`, `revisiones`, `correria`, `revisionessac`, `revisionessirius`

---

### Cargar medidores
`POST /api/medidores/load`

Lee `src/data/medidores.xlsx` y hace upsert en la tabla `medidores`.

---

### Subir archivo a `src/data/`
`POST /api/upload/data` — `multipart/form-data`, campo `files`

### Subir archivo a `filesTiempos/`
`POST /api/upload/times` — `multipart/form-data`, campo `files`

Límite: 50 MB por archivo. Formatos: `.xlsx`, `.xls`, `.csv`

---

## Clientes

### Consultar un cliente
`POST /api/cliente/records`

**Body:**
```json
{ "cliente": "1170143751", "desde": 202401, "hasta": 202512 }
```

### Consultar múltiples clientes
`POST /api/clientes/records`

**Body:**
```json
{ "clientes": ["1170143751", "1160143703"], "desde": 202401, "hasta": 202512 }
```

---

## Log de consultas

### Registrar una consulta externa
`POST /api/logConsultas/registrar-consulta`

**Body:**
```json
{
  "clienteId": "1170143751",
  "usuario": "Juan Pérez",
  "tipoConsulta": "cliente",
  "detalles": "Consulta desde app móvil"
}
```

**Respuesta:** `{ "ok": true }`

---

## Panel de información

### Obtener conteos del panel
`GET /api/consulta/informacion/panel` 🔒

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "cantidad_lectura": 150000,
    "cantidad_consulta": 3200,
    "cantidad_empleado": 202,
    "cantidad_empleado_activo": 180,
    "cantidad_cliente_sac": 95000,
    "cantidad_tipo_factura": 1200
  }
}
```

---

## Códigos de respuesta

| HTTP | Significado |
|------|-------------|
| 200 | Éxito |
| 201 | Creado / registrado exitosamente |
| 400 | Datos faltantes o inválidos |
| 401 | Token inválido o expirado |
| 403 | Sin permisos para este recurso |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |
