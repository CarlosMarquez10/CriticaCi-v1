# API Documentation - CriticaCi-v1 📚

Esta documentación describe todos los endpoints disponibles en la API de CriticaCi-v1.

## Base URL
```
https://vms41rr2-3000.use2.devtunnels.ms/api
```

## Índice
- [Medidores](#medidores)
- [Clientes](#clientes)
- [Empleados](#empleados)
- [Archivos](#archivos)
- [Excel/Reportes](#excelreportes)
- [Códigos de Respuesta](#códigos-de-respuesta)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Medidores

### 🔍 Consultar Medidor por Cliente
**GET** `/api/medidores/:cliente_medidor`  
**GET** `/api/medidores?cliente_medidor=:cliente_medidor`

Obtiene información de medidores para un cliente específico.

**Parámetros:**
- `cliente_medidor` (string): ID del cliente medidor

**Respuesta exitosa:**
```json
{
  "ok": true,
  "cliente_medidor": "202957",
  "total": 1,
  "rows": [
    {
      "id": 1,
      "cliente_medidor": "202957",
      "num_medidor": "12345678",
      "marca_medidor": "ELSTER",
      "tecnologia_medidor": "ELECTRONICO",
      "tipo_medidor": "MONOFASICO"
    }
  ]
}
```

**Respuesta de error:**
```json
{
  "ok": false,
  "message": "No se encontraron registros para cliente_medidor='202957'.",
  "cliente_medidor": "202957",
  "rows": [],
  "total": 0
}
```

### 🔍 Buscar Múltiples Medidores
**POST** `/api/medidores/search`

Busca medidores para uno o múltiples clientes.

**Body:**
```json
{
  "cliente_medidor": "202957"
}
```
o
```json
{
  "clientes": ["202957", "123456", "789012"]
}
```

**Respuesta:**
```json
{
  "ok": true,
  "totalConsultados": 3,
  "totalEncontrados": 2,
  "rows": [...],
  "grouped": {
    "202957": [...],
    "123456": [...]
  },
  "clientesBuscados": ["202957", "123456", "789012"]
}
```

### 📥 Cargar Medidores desde Excel
**POST** `/api/medidores/load`

Carga medidores desde un archivo Excel ubicado en `src/data/medidores.xlsx`.

**Respuesta:**
```json
{
  "ok": true,
  "message": "Medidores cargados exitosamente",
  "insertados": 150,
  "actualizados": 25
}
```

---

## Clientes

### 🔍 Consultar Registros de Cliente Individual
**POST** `/api/cliente/records`

Obtiene registros de lecturas para un cliente específico.

**Body:**
```json
{
  "cliente": "1170143751",
  "desde": 202401,
  "hasta": 202512
}
```

**Parámetros:**
- `cliente` (string, requerido): ID del cliente
- `desde` (number, opcional): Período inicial (YYYYMM)
- `hasta` (number, opcional): Período final (YYYYMM)

**Respuesta:**
```json
{
  "ok": true,
  "cliente": "1170143751",
  "total": 12,
  "rows": [
    {
      "id": 1,
      "cliente": "1170143751",
      "medidor": "12345678",
      "lectura_actual": 1250,
      "periodo": 202401,
      "zona": "A1",
      "ciclo": "01"
    }
  ]
}
```

### 🔍 Consultar Registros de Múltiples Clientes
**POST** `/api/clientes/records`

Obtiene registros para múltiples clientes.

**Body:**
```json
{
  "clientes": ["1170143751", "1160143703"],
  "desde": 202401,
  "hasta": 202512,
  "planop": false
}
```

**Parámetros:**
- `clientes` (array|object, requerido): Lista de IDs de clientes o objeto `{"id": true}`
- `desde` (number, opcional): Período inicial (YYYYMM)
- `hasta` (number, opcional): Período final (YYYYMM)
- `planop` (boolean, opcional): Si `true` devuelve array plano, si `false` agrupa por cliente

**Límites:**
- Máximo 10,000 clientes por solicitud

**Respuesta (agrupada):**
```json
{
  "ok": true,
  "total": 24,
  "desde": 202401,
  "hasta": 202512,
  "clientes": 2,
  "data": {
    "1170143751": [...],
    "1160143703": [...]
  }
}
```

---

## Empleados

### 📥 Importar Empleados desde Excel
**POST** `/api/empleados/importar`

Importa empleados desde un archivo Excel ubicado en `src/data/empleados.xlsx`.

**Respuesta:**
```json
{
  "ok": true,
  "message": "Empleados importados exitosamente",
  "procesados": 50,
  "insertados": 45,
  "actualizados": 5,
  "errores": []
}
```

---

## Archivos

### 📁 Listar Archivos
**GET** `/api/files`

Lista y cuenta archivos `.xlsx` en el directorio `filesTiempos`.

**Respuesta:**
```json
{
  "ok": true,
  "directorio": "filesTiempos",
  "totalArchivos": 5,
  "archivos": [
    {
      "nombre": "TIEMPO_CUT-01-ABRIL.xlsx",
      "tamaño": "2.5 MB",
      "fechaModificacion": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 📤 Cargar Archivo
**POST** `/api/load`

Procesa un archivo específico del directorio `filesTiempos`.

**Body:**
```json
{
  "filename": "TIEMPO_CUT-01-ABRIL.xlsx"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "message": "Archivo procesado exitosamente",
  "archivo": "TIEMPO_CUT-01-ABRIL.xlsx",
  "registrosProcesados": 1250,
  "registrosInsertados": 1200,
  "errores": 50
}
```

---

## Excel/Reportes

### 📊 Generar Reporte Excel Completo
**GET** `/api/excel/generate`

Genera un archivo Excel completo con todos los registros enriquecidos y observaciones.

**Respuesta:**
- Descarga directa del archivo `RegistrosConObservaciones.xlsx`
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Columnas incluidas:**
- Datos básicos: CLIENTE, MEDIDOR, ZONA, CICLO, PERIODO
- Lecturas: LECTURA_ACTUAL, LECTURAFACTURADA, TIPOLECTURA
- Observaciones: TIPODEERROR, ACLARACIONES, KWAJUSTADOS
- Lecturas históricas: Lectura_1, Lectura_2, Lectura_3, Lectura_4
- Observaciones históricas: Obs_Lectura_1, Obs_Lectura_2, Obs_Lectura_3, Obs_Lectura_4
- Información del medidor: medidor, marcamedidor, tipomedidor
- Operario: Operario, cedula, tipo, sede
- Validación: Validacion, obsValidacion

### 📊 Generar Reporte Excel Personalizado
**POST** `/api/excel/custom`

Genera un archivo Excel personalizado con filtros específicos.

**Body:**
```json
{
  "zona": "A1",
  "ciclo": "01",
  "tipoError": "LECTURA_IMPOSIBLE",
  "operario": "JUAN_PEREZ",
  "incluirLecturasHistoricas": true
}
```

**Parámetros (todos opcionales):**
- `zona` (string): Filtrar por zona específica
- `ciclo` (string): Filtrar por ciclo específico
- `tipoError` (string): Filtrar por tipo de error específico
- `operario` (string): Filtrar por operario específico
- `incluirLecturasHistoricas` (boolean): Incluir columnas de lecturas históricas

**Respuesta:**
- Descarga directa del archivo Excel filtrado
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

## Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | Éxito |
| 400 | Solicitud incorrecta (parámetros faltantes o inválidos) |
| 404 | Recurso no encontrado |
| 413 | Payload demasiado grande (>10,000 clientes) |
| 500 | Error interno del servidor |

---

## Ejemplos de Uso

### Consultar un medidor específico
```bash
curl -X GET "https://vms41rr2-3000.use2.devtunnels.ms/api/medidores/202957"
```

### Buscar múltiples medidores
```bash
curl -X POST "https://vms41rr2-3000.use2.devtunnels.ms/api/medidores/search" \
  -H "Content-Type: application/json" \
  -d '{"clientes": ["202957", "123456"]}'
```

### Obtener registros de un cliente
```bash
curl -X POST "https://vms41rr2-3000.use2.devtunnels.ms/api/cliente/records" \
  -H "Content-Type: application/json" \
  -d '{"cliente": "1170143751", "desde": 202401, "hasta": 202412}'
```

### Generar reporte Excel
```bash
curl -X GET "https://vms41rr2-3000.use2.devtunnels.ms/api/excel/generate" \
  --output "reporte.xlsx"
```

### Generar reporte Excel personalizado
```bash
curl -X POST "https://vms41rr2-3000.use2.devtunnels.ms/api/excel/custom" \
  -H "Content-Type: application/json" \
  -d '{"zona": "A1", "incluirLecturasHistoricas": true}' \
  --output "reporte_personalizado.xlsx"
```

---

## Notas Importantes

1. **Formato de Fechas**: Los períodos se manejan en formato YYYYMM (ej: 202401 para enero 2024)

2. **Límites de Solicitud**: 
   - Máximo 10,000 clientes por solicitud en `/api/clientes/records`
   - Tamaño máximo de JSON: 2MB

3. **Archivos Excel**: 
   - Los archivos se generan con formato profesional incluyendo bordes y estilos
   - Las columnas se ajustan automáticamente al contenido

4. **Manejo de Errores**: 
   - Todos los endpoints devuelven un objeto JSON con la propiedad `ok`
   - Los errores incluyen mensajes descriptivos en español

5. **Base de Datos**: 
   - La API utiliza MySQL con pool de conexiones
   - Las consultas están optimizadas para grandes volúmenes de datos