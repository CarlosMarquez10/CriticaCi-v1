# Base de Datos — CriticaCi-v2

- **Motor:** MySQL 8.0+
- **Base de datos:** `clientesCI`
- **Charset:** utf8mb4 / utf8mb4_unicode_ci

---

## Índice

- [Diagrama de tablas](#diagrama-de-tablas)
- [Tabla: tiempos](#tabla-tiempos)
- [Tabla: empleados](#tabla-empleados)
- [Tabla: medidores](#tabla-medidores)
- [Tabla: clientes](#tabla-clientes)
- [Tabla: clientessac](#tabla-clientessac)
- [Tabla: clientes_servicios](#tabla-clientes_servicios)
- [Tabla: revisiones_sac](#tabla-revisiones_sac)
- [Tabla: revisiones_sirius](#tabla-revisiones_sirius)
- [Tabla: TipoFacturacion](#tabla-tipofacturacion)
- [Tabla: Correria](#tabla-correria)
- [Tabla: log_consultas](#tabla-log_consultas)

---

## Diagrama de tablas

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   tiempos   │     │   empleados  │     │    medidores    │
├─────────────┤     ├──────────────┤     ├─────────────────┤
│ CLIENTE  ───┼──┐  │ id (PK)      │     │ id (PK)         │
│ MEDIDOR     │  │  │ cedula (UK)  │     │ cliente_medidor  │
│ LECTOR   ───┼──┼──┤ nombre       │     │ num_medidor      │
│ ANO         │  │  │ cargo        │     │ marca_medidor    │
│ MES         │  │  │ sede         │     │ tecnologia       │
│ CICLO       │  │  │ authToken    │     │ tipo_medidor     │
│ ZONA        │  │  │ definitiveP. │     └─────────────────┘
└─────────────┘  │  └──────────────┘
                 │
        ┌────────┴──────────┐
        │                   │
┌───────▼──────┐   ┌────────▼──────────┐
│   clientes   │   │    clientessac     │
├──────────────┤   ├───────────────────┤
│ CLIENTE_ID   │   │ ClienteId         │
│ NOMBRE       │   │ Nombre            │
│ DIRECCION    │   │ Direccion         │
│ BARRIO       │   │ Medidor           │
│ CICLO        │   │ Ciclo             │
└──────────────┘   └───────────────────┘
```

---

## Tabla: tiempos

Tabla principal. Almacena las lecturas de medidores por operario.

```sql
CREATE TABLE tiempos (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    CORRERIA    VARCHAR(50),
    INSTALACION VARCHAR(100),
    CLIENTE     VARCHAR(150),
    MEDIDOR     VARCHAR(50),
    LECTOR      VARCHAR(100),    -- cédula del operario
    ANO         SMALLINT,
    MES         TINYINT,
    CICLO       INT,
    ZONA        VARCHAR(50),
    FECHAULTLABOR DATE,
    HORAULTLABOR  TIME,
    CODTAREA    VARCHAR(50),
    LECTURA_ACT INT,

    KEY idx_anomes  (ANO, MES),
    KEY idx_cliente (CLIENTE(50)),
    KEY idx_medidor (MEDIDOR)
)
```

**Notas:**
- `LECTOR` almacena la cédula del operario (se resuelve a nombre en la API via `empleados.cedula`).
- La API busca con fallback multi-año/mes: desde el año más reciente, mes 12 hacia atrás.
- Índice compuesto `(ANO, MES)` optimiza las consultas de período.

---

## Tabla: empleados

Almacena operarios y usuarios del sistema. Sirve tanto para autenticación como para enriquecer lecturas.

```sql
CREATE TABLE empleados (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    sede               VARCHAR(100) NOT NULL,
    cedula             BIGINT NOT NULL UNIQUE,
    nombre             VARCHAR(200) NOT NULL,
    cargo              VARCHAR(100) NOT NULL,
    -- Campos de autenticación (agregados post-creación)
    temporaryPassword  VARCHAR(255),
    definitivePassword VARCHAR(255),
    passwordChanged    TINYINT(1) DEFAULT 0,
    isFirstLogin       TINYINT(1) DEFAULT 0,
    authToken          TEXT,
    lastLogin          DATETIME,
    passwordCreatedAt  DATETIME
)
```

**Cargos y roles:**

| Cargo | Rol en API |
|-------|-----------|
| `TECNOLOGO CGO` | `ADMIN` |
| `TECNÓLOGO(Supervísor)` | `SUPERVISOR` |
| `PROFESIONAL 3 CALIDAD` | `PRO_CALIDAD` |
| `PROFESIONAL` | `PROFESIONAL` |
| `OPERATIVO 1 / 2 / 3` | `BASICO` |

**Carga:** `POST /api/empleados/importar` — solo inserta nuevos (no actualiza existentes). Después genera `src/fileJson/empleados.json`.

---

## Tabla: medidores

Información técnica de los medidores.

```sql
CREATE TABLE medidores (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_medidor     BIGINT UNSIGNED,
    num_medidor         VARCHAR(32),
    marca_medidor       VARCHAR(50),
    tecnologia_medidor  VARCHAR(50),
    tipo_medidor        VARCHAR(50),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    KEY idx_cliente_medidor (cliente_medidor),
    KEY idx_num_medidor     (num_medidor)
)
```

**Carga:** `POST /api/medidores/load` — upsert desde `src/data/medidores.xlsx`.

---

## Tabla: clientes

Catálogo principal de clientes de CENS.

```sql
-- Campos principales
CLIENTE_ID, NOMBRE, DIRECCION, BARRIO, CICLO,
MARCA_MEDIDOR, TRANSFORMADOR, ALIMENTADOR,
D_TIPO_REGISTRADOR, RUTA_REPARTO, RUTA_LECTURA
```

**Carga:** `POST /api/data/load` con `target: "clientes"`.

---

## Tabla: clientessac

Clientes desde el sistema SAC. Complementa la tabla `clientes`.

```sql
-- Campos principales
ClienteId, Nombre, Direccion, DBarrioVereda,
Medidor, Ciclo, RutaLectura,
DEstadoCliente, Telefono, TelefonoCelular, TelefonoContacto,
CodigoUbicTransformador
```

**Carga:** `POST /api/data/load` con `target: "clientessac"`.

---

## Tabla: clientes_servicios

Revisiones de servicio de clientes (origen: sistema de gestión interno).

```sql
-- Campos principales (selección usada en API)
CLIENTE_ID, NOMBRE, DIRECCION, MUNICIPIO, CICLO,
CLASE_SERVICIO, RUTA_LECTURA,
SERIE_I, MARCA_I, UBICACION_I, PROPIEDAD_I, ACCION_MEDIDOR_I, LECTURA_I,
NUMERO_REVISION, ESTADO_REVISION, D_TIPO,
FECHA_SOLICITUD, FECHA_REVISION, FECHA_SISTEMA,
REVISOR, D_REVISOR, IDESTADO,
TERMINALDESCARGA, FECHAULTLABOR, CORRERIA,
OBSERVACION, D_OBSERVACION, OBSREVISION,
TRANSFORMADOR, FECHAHORAINICIAL
```

**Acceso:** `POST /api/revisiones/consultar`. Los campos devueltos varían según el cargo del usuario.

---

## Tabla: revisiones_sac

Revisiones desde el sistema SAC.

```sql
CREATE TABLE revisiones_sac (
    NumeroRevision     INT UNSIGNED PRIMARY KEY,
    ClienteId          INT UNSIGNED NOT NULL,
    Nombre             VARCHAR(100),
    Direccion          VARCHAR(150),
    Zona               TINYINT UNSIGNED,
    Ciclo              SMALLINT UNSIGNED,
    SerieMedidor       VARCHAR(20),
    MarcaMedidor       VARCHAR(10),
    Estado             CHAR(1),
    DEstado            VARCHAR(30),
    FechaSolicitud     DATE,
    FechaProgramacion  DATE,
    Comentario         TEXT,
    Revisor            SMALLINT UNSIGNED,
    DRevisor           VARCHAR(100),
    RutaLectura        BIGINT UNSIGNED,
    -- ...más campos de auditoría y proceso
    INDEX idx_cliente (ClienteId),
    INDEX idx_estado  (Estado)
)
```

**Carga:** `POST /api/data/load` con `target: "revisionessac"`.

---

## Tabla: revisiones_sirius

Revisiones desde el sistema Sirius.

```sql
CREATE TABLE revisiones_sirius (
    id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    IdCliente              INT UNSIGNED NOT NULL,
    Nombre                 VARCHAR(100),
    Direccion              VARCHAR(150),
    Correria               VARCHAR(20),
    Anio                   YEAR,
    Mes                    TINYINT UNSIGNED,
    IdOrdenTrabajo         INT UNSIGNED,
    DescripcionTarea       VARCHAR(100),
    EstadoOrden            TINYINT UNSIGNED,
    DescripcionEstadoOrden VARCHAR(50),
    FechaProg              DATE,
    RutaLectura            BIGINT UNSIGNED,
    Ciclo                  SMALLINT UNSIGNED,
    -- ...más campos de estado y observaciones
    INDEX idx_cliente (IdCliente),
    INDEX idx_correria (Correria)
)
```

**Carga:** `POST /api/data/load` con `target: "revisionessirius"`.

---

## Tabla: TipoFacturacion

Tipo de facturación y correo por cliente.

```sql
-- Campos principales
CLIENTE_ID, TIPO_RECIBO, CORREO_ELECTRONICO
```

**Carga:** `POST /api/data/load` con `target: "tipofacturacion"`.

---

## Tabla: Correria

Correrias de lectura.

**Carga:** `POST /api/data/load` con `target: "correria"`.

---

## Tabla: log_consultas

Auditoría de todas las consultas realizadas por los usuarios.

```sql
CREATE TABLE log_consultas (
    LogId          INT AUTO_INCREMENT PRIMARY KEY,
    ClienteId      VARCHAR(20),          -- cédula o ID del cliente consultado
    FechaConsulta  DATETIME DEFAULT CURRENT_TIMESTAMP,
    Usuario        VARCHAR(100),
    TipoConsulta   VARCHAR(50),          -- 'cliente', 'medidor', 'revisiones'
    Detalles       TEXT
)
```

**Escritura:** automática al consumir los endpoints de consulta (`/api/consulta/tiempos`, `/api/revisiones/consultar`). También manual via `POST /api/logConsultas/registrar-consulta`.

---

## Orden de carga inicial

Para una instalación desde cero ejecutar los scripts SQL en este orden:

```bash
mysql -u usuario -p clientesCI < src/schemas/01_clientesCI_tiempos.sql
mysql -u usuario -p clientesCI < src/schemas/tablaEmpleados.sql
mysql -u usuario -p clientesCI < src/schemas/tabla_medidores.sql
mysql -u usuario -p clientesCI < src/schemas/tabla_clientesSac.sql
mysql -u usuario -p clientesCI < src/schemas/tablas\ marcopolo_tipoFaccc.sql
mysql -u usuario -p clientesCI < src/schemas/Correria.sql
mysql -u usuario -p clientesCI < src/schemas/log_consultas.sql
mysql -u usuario -p clientesCI < src/schemas/Obs_Lectura.sql
mysql -u usuario -p clientesCI < src/schemas/Revisiones_sac.sql
mysql -u usuario -p clientesCI < src/schemas/Revisiones_sirius.sql
mysql -u usuario -p clientesCI < src/schemas/Revisiones_sirius_master.sql
mysql -u usuario -p clientesCI < src/schemas/Revisiones_sac.sql
```
