# Documentación de Base de Datos - CriticaCi-v1 🗄️

Esta documentación describe la estructura de la base de datos MySQL utilizada en el sistema CriticaCi-v1.

## Configuración de Base de Datos

### Información General
- **Motor**: MySQL 8.0+
- **Charset**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Nombre de BD**: `clientesCI`

### Configuración de Conexión
```javascript
// Configuración típica en .env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=clientesCI
DB_PORT=3306
```

---

## Esquema de Tablas

### 📊 Tabla: `tiempos`
Tabla principal que almacena las lecturas y registros de medidores.

```sql
CREATE TABLE IF NOT EXISTS tiempos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    CORRERIA VARCHAR(50) NULL,
    INSTALACION VARCHAR(100) NULL,
    CLIENTE VARCHAR(150) NULL,
    MEDIDOR VARCHAR(50) NULL,
    LECTOR VARCHAR(100) NULL,
    ANO SMALLINT NULL,
    MES TINYINT NULL,
    CICLO INT NULL,
    ZONA VARCHAR(50) NULL,
    FECHAULTLABOR DATE NULL,
    HORAULTLABOR TIME NULL,
    CODTAREA VARCHAR(50) NULL,
    LECTURA_ACT INT NULL,
    PRIMARY KEY (id),
    KEY idx_anomes (ANO, MES),
    KEY idx_cliente (CLIENTE(50)),
    KEY idx_medidor (MEDIDOR)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Descripción de Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT UNSIGNED | Identificador único autoincremental |
| `CORRERIA` | VARCHAR(50) | Identificador de correría |
| `INSTALACION` | VARCHAR(100) | Código de instalación |
| `CLIENTE` | VARCHAR(150) | Identificador del cliente |
| `MEDIDOR` | VARCHAR(50) | Número del medidor |
| `LECTOR` | VARCHAR(100) | Nombre del lector/operario |
| `ANO` | SMALLINT | Año de la lectura |
| `MES` | TINYINT | Mes de la lectura (1-12) |
| `CICLO` | INT | Ciclo de facturación |
| `ZONA` | VARCHAR(50) | Zona geográfica |
| `FECHAULTLABOR` | DATE | Fecha de última labor |
| `HORAULTLABOR` | TIME | Hora de última labor |
| `CODTAREA` | VARCHAR(50) | Código de tarea realizada |
| `LECTURA_ACT` | INT | Lectura actual del medidor |

**Índices:**
- `PRIMARY KEY (id)`: Clave primaria
- `idx_anomes (ANO, MES)`: Optimiza consultas por período
- `idx_cliente (CLIENTE(50))`: Optimiza búsquedas por cliente
- `idx_medidor (MEDIDOR)`: Optimiza búsquedas por medidor

---

### 👥 Tabla: `empleados`
Almacena información de empleados/operarios del sistema.

```sql
CREATE TABLE empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sede VARCHAR(100) NOT NULL,
    cedula BIGINT NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    cargo VARCHAR(100) NOT NULL
);
```

**Descripción de Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | Identificador único autoincremental |
| `sede` | VARCHAR(100) | Sede de trabajo del empleado |
| `cedula` | BIGINT | Número de cédula (único) |
| `nombre` | VARCHAR(200) | Nombre completo del empleado |
| `cargo` | VARCHAR(100) | Cargo o posición del empleado |

**Restricciones:**
- `cedula` debe ser único (UNIQUE constraint)
- Todos los campos son NOT NULL excepto `id`

---

### 🔌 Tabla: `medidores`
Almacena información técnica de los medidores.

```sql
CREATE TABLE IF NOT EXISTS medidores (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cliente_medidor BIGINT UNSIGNED NULL,
    num_medidor VARCHAR(32) NULL,
    marca_medidor VARCHAR(50) NULL,
    tecnologia_medidor VARCHAR(50) NULL,
    tipo_medidor VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_cliente_medidor (cliente_medidor),
    KEY idx_num_medidor (num_medidor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Descripción de Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT UNSIGNED | Identificador único autoincremental |
| `cliente_medidor` | BIGINT UNSIGNED | ID del cliente propietario |
| `num_medidor` | VARCHAR(32) | Número de serie del medidor |
| `marca_medidor` | VARCHAR(50) | Marca del medidor (ej: ELSTER, LANDIS) |
| `tecnologia_medidor` | VARCHAR(50) | Tecnología (ej: ELECTRONICO, MECANICO) |
| `tipo_medidor` | VARCHAR(50) | Tipo (ej: MONOFASICO, TRIFASICO) |
| `created_at` | TIMESTAMP | Fecha de creación del registro |

**Índices:**
- `PRIMARY KEY (id)`: Clave primaria
- `idx_cliente_medidor (cliente_medidor)`: Optimiza búsquedas por cliente
- `idx_num_medidor (num_medidor)`: Optimiza búsquedas por número de medidor

---

## Relaciones entre Tablas

### Diagrama de Relaciones
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   tiempos   │       │  medidores  │       │  empleados  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ CLIENTE     │◄─────►│cliente_med..│       │ cedula (UK) │
│ MEDIDOR     │◄─────►│ num_medidor │       │ nombre      │
│ LECTOR      │◄─────►│             │       │ sede        │
│ ANO         │       │             │       │ cargo       │
│ MES         │       │             │       │             │
│ ...         │       │             │       │             │
└─────────────┘       └─────────────┘       └─────────────┘
```

### Relaciones Lógicas

1. **tiempos ↔ medidores**
   - `tiempos.CLIENTE` se relaciona con `medidores.cliente_medidor`
   - `tiempos.MEDIDOR` se relaciona con `medidores.num_medidor`
   - Relación: Un cliente puede tener múltiples medidores, un medidor puede tener múltiples lecturas

2. **tiempos ↔ empleados**
   - `tiempos.LECTOR` se relaciona con `empleados.nombre`
   - Relación: Un empleado puede realizar múltiples lecturas

---

## Consultas Comunes

### 📊 Consultas de Lecturas

```sql
-- Obtener lecturas de un cliente específico
SELECT * FROM tiempos 
WHERE CLIENTE = '1170143751' 
ORDER BY ANO DESC, MES DESC;

-- Lecturas por período
SELECT * FROM tiempos 
WHERE ANO = 2024 AND MES BETWEEN 1 AND 6
ORDER BY CLIENTE, ANO, MES;

-- Lecturas por zona y ciclo
SELECT * FROM tiempos 
WHERE ZONA = 'A1' AND CICLO = 1
ORDER BY FECHAULTLABOR DESC;
```

### 🔌 Consultas de Medidores

```sql
-- Medidores de un cliente
SELECT * FROM medidores 
WHERE cliente_medidor = 202957;

-- Medidores por marca
SELECT marca_medidor, COUNT(*) as total
FROM medidores 
GROUP BY marca_medidor;

-- Información completa cliente-medidor
SELECT t.CLIENTE, t.MEDIDOR, m.marca_medidor, m.tecnologia_medidor
FROM tiempos t
LEFT JOIN medidores m ON t.CLIENTE = m.cliente_medidor 
    AND t.MEDIDOR = m.num_medidor
WHERE t.CLIENTE = '202957';
```

### 👥 Consultas de Empleados

```sql
-- Empleados por sede
SELECT sede, COUNT(*) as total_empleados
FROM empleados 
GROUP BY sede;

-- Lecturas por empleado
SELECT e.nombre, e.sede, COUNT(t.id) as total_lecturas
FROM empleados e
LEFT JOIN tiempos t ON e.nombre = t.LECTOR
GROUP BY e.id, e.nombre, e.sede;
```

---

## Optimización y Performance

### Índices Recomendados

```sql
-- Índices adicionales para optimización
CREATE INDEX idx_tiempos_fecha ON tiempos(FECHAULTLABOR);
CREATE INDEX idx_tiempos_zona_ciclo ON tiempos(ZONA, CICLO);
CREATE INDEX idx_tiempos_lector ON tiempos(LECTOR);

-- Índice compuesto para consultas frecuentes
CREATE INDEX idx_tiempos_cliente_periodo ON tiempos(CLIENTE, ANO, MES);
```

### Consultas Optimizadas

```sql
-- Usar LIMIT para grandes datasets
SELECT * FROM tiempos 
WHERE CLIENTE = '1170143751' 
ORDER BY ANO DESC, MES DESC 
LIMIT 100;

-- Usar EXISTS para verificar relaciones
SELECT t.* FROM tiempos t
WHERE EXISTS (
    SELECT 1 FROM medidores m 
    WHERE m.cliente_medidor = t.CLIENTE
);
```

---

## Mantenimiento

### Backup Recomendado

```bash
# Backup completo
mysqldump -u usuario -p clientesCI > backup_clientesCI_$(date +%Y%m%d).sql

# Backup solo estructura
mysqldump -u usuario -p --no-data clientesCI > estructura_clientesCI.sql

# Backup solo datos
mysqldump -u usuario -p --no-create-info clientesCI > datos_clientesCI.sql
```

### Limpieza de Datos

```sql
-- Eliminar registros antiguos (más de 2 años)
DELETE FROM tiempos 
WHERE ANO < YEAR(CURDATE()) - 2;

-- Limpiar registros huérfanos
DELETE t FROM tiempos t
LEFT JOIN medidores m ON t.CLIENTE = m.cliente_medidor
WHERE m.cliente_medidor IS NULL;
```

---

## Migración y Versionado

### Scripts de Migración

Los scripts SQL están organizados en:
- `01_clientesCI_tiempos.sql` - Tabla principal y base de datos
- `tablaEmpleados.sql` - Tabla de empleados
- `tabla_medidores.sql` - Tabla de medidores

### Orden de Ejecución

1. Ejecutar `01_clientesCI_tiempos.sql` (crea BD y tabla principal)
2. Ejecutar `tablaEmpleados.sql` (crea tabla empleados)
3. Ejecutar `tabla_medidores.sql` (crea tabla medidores)

```bash
mysql -u usuario -p < src/schemas/01_clientesCI_tiempos.sql
mysql -u usuario -p < src/schemas/tablaEmpleados.sql
mysql -u usuario -p < src/schemas/tabla_medidores.sql
```

---

## Notas Importantes

1. **Charset UTF8MB4**: Soporta emojis y caracteres especiales
2. **Collation Unicode**: Ordenamiento correcto para caracteres latinos
3. **InnoDB Engine**: Soporte para transacciones y claves foráneas
4. **Timestamps**: Automáticos para auditoría de cambios
5. **Índices**: Optimizados para consultas frecuentes por cliente, período y medidor