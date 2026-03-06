import path from 'path';
import pkg from 'xlsx';
const { readFile, utils } = pkg;
import { pool } from '../connection/db.js';
import { normalizeHeader, toNull, toInt, toDate, toTime } from '../utils/normalize.js';
import { buildInsertSQLRevisionesSirius } from '../utils/sql_revisionessirius.js';

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);
const TXN_ROWS   = Number(process.env.TXN_ROWS || 20000);

const HEADER_MAP = {
  // Programa
  'PROGRAMA': 'Programa',

  // Año
  'ANIO': 'Anio', 'ANO': 'Anio', 'AÑO': 'Anio',

  // Mes
  'MES': 'Mes',

  // Correría → después de normalizeHeader quita tilde → CORRERIA
  'CORRERIA': 'Correria', 'CORRERÍA': 'Correria',

  // Id. Orden Trabajo → normalizeHeader quita tilde y puntos → ID ORDEN TRABAJO
  'IDORDENTRABAJO': 'IdOrdenTrabajo',
  'ID ORDEN TRABAJO': 'IdOrdenTrabajo',
  'ID_ORDEN_TRABAJO': 'IdOrdenTrabajo',

  // Secuencia
  'SECUENCIA': 'Secuencia',

  // Tarea
  'TAREA': 'Tarea',

  // Descripción Tarea → DESCRIPCION TAREA
  'DESCRIPCIONTAREA': 'DescripcionTarea',
  'DESCRIPCION TAREA': 'DescripcionTarea',
  'DESCRIPCION_TAREA': 'DescripcionTarea',

  // Id. Cliente → ID CLIENTE
  'IDCLIENTE': 'IdCliente',
  'ID CLIENTE': 'IdCliente',
  'ID_CLIENTE': 'IdCliente',
  'CLIENTE': 'IdCliente',

  // Nombre
  'NOMBRE': 'Nombre',

  // Estado Orden → ESTADO ORDEN
  'ESTADOORDEN': 'EstadoOrden',
  'ESTADO ORDEN': 'EstadoOrden',
  'ESTADO_ORDEN': 'EstadoOrden',

  // Descripción Estado Orden → DESCRIPCION ESTADO ORDEN
  'DESCRIPCIONESTADOORDEN': 'DescripcionEstadoOrden',
  'DESCRIPCION ESTADO ORDEN': 'DescripcionEstadoOrden',
  'DESCRIPCION_ESTADO_ORDEN': 'DescripcionEstadoOrden',

  // Estado Tarea → ESTADO TAREA
  'ESTADOTAREA': 'EstadoTarea',
  'ESTADO TAREA': 'EstadoTarea',
  'ESTADO_TAREA': 'EstadoTarea',

  // Descripción Estado Tarea → DESCRIPCION ESTADO TAREA
  'DESCRIPCIONESTADOTAREA': 'DescripcionEstadoTarea',
  'DESCRIPCION ESTADO TAREA': 'DescripcionEstadoTarea',
  'DESCRIPCION_ESTADO_TAREA': 'DescripcionEstadoTarea',

  // Nueva
  'NUEVA': 'Nueva',

  // ID Nueva Comercial → ID NUEVA COMERCIAL
  'IDNUEVACOMERCIAL': 'IdNuevaComercial',
  'ID NUEVA COMERCIAL': 'IdNuevaComercial',
  'ID_NUEVA_COMERCIAL': 'IdNuevaComercial',

  // Dirección → DIRECCION (normalizeHeader quita tilde)
  'DIRECCION': 'Direccion', 'DIRECCIÓN': 'Direccion',

  // Revisión → REVISION
  'REVISION': 'Revision', 'REVISIÓN': 'Revision',

  // Tipo Prog. → TIPO PROG (normalizeHeader quita el punto)
  'TIPOPROG': 'TipoProg',
  'TIPO PROG': 'TipoProg',
  'TIPO_PROG': 'TipoProg',

  // Fecha Prog. → FECHA PROG
  'FECHAPROG': 'FechaProg',
  'FECHA PROG': 'FechaProg',
  'FECHA_PROG': 'FechaProg',

  // Ruta Lectura → RUTA LECTURA
  'RUTALECTURA': 'RutaLectura',
  'RUTA LECTURA': 'RutaLectura',
  'RUTA_LECTURA': 'RutaLectura',

  // Instalación → INSTALACION
  'INSTALACION': 'Instalacion', 'INSTALACIÓN': 'Instalacion',

  // Ciclo
  'CICLO': 'Ciclo',

  // Municipio
  'MUNICIPIO': 'Municipio',

  // Nombre Municipio → NOMBRE MUNICIPIO
  'NOMBREMUNICIPIO': 'NombreMunicipio',
  'NOMBRE MUNICIPIO': 'NombreMunicipio',
  'NOMBRE_MUNICIPIO': 'NombreMunicipio',

  // Localidad
  'LOCALIDAD': 'Localidad',

  // Nombre Localidad → NOMBRE LOCALIDAD
  'NOMBRELOCALIDAD': 'NombreLocalidad',
  'NOMBRE LOCALIDAD': 'NombreLocalidad',
  'NOMBRE_LOCALIDAD': 'NombreLocalidad',

  // Cód. Rango → COD RANGO (normalizeHeader quita tilde y punto)
  'CODRANGO': 'CodRango',
  'COD RANGO': 'CodRango',
  'COD_RANGO': 'CodRango',

  // Nodo
  'NODO': 'Nodo',

  // GPS
  'GPS': 'GPS',

  // Clase Servicio → CLASE SERVICIO
  'CLASESERVICIO': 'ClaseServicio',
  'CLASE SERVICIO': 'ClaseServicio',
  'CLASE_SERVICIO': 'ClaseServicio',

  // Descripción Clase → DESCRIPCION CLASE
  'DESCRIPCIONCLASE': 'DescripcionClase',
  'DESCRIPCION CLASE': 'DescripcionClase',
  'DESCRIPCION_CLASE': 'DescripcionClase',

  // Estrato
  'ESTRATO': 'Estrato',

  // Vehículo → VEHICULO
  'VEHICULO': 'Vehiculo', 'VEHÍCULO': 'Vehiculo',

  // Ind. Advertencia → IND ADVERTENCIA
  'INDADVERTENCIA': 'IndAdvertencia',
  'IND ADVERTENCIA': 'IndAdvertencia',
  'IND_ADVERTENCIA': 'IndAdvertencia',

  // Advertencia
  'ADVERTENCIA': 'Advertencia',

  // Fecha Ult. Labor → FECHA ULT LABOR
  'FECHAULTLABOR': 'FechaUltLabor',
  'FECHA ULT LABOR': 'FechaUltLabor',
  'FECHA_ULT_LABOR': 'FechaUltLabor',

  // Hora Ult. Labor → HORA ULT LABOR
  'HORAULTLABOR': 'HoraUltLabor',
  'HORA ULT LABOR': 'HoraUltLabor',
  'HORA_ULT_LABOR': 'HoraUltLabor',

  // Usuario Labor → USUARIO LABOR
  'USUARIOLABOR': 'UsuarioLabor',
  'USUARIO LABOR': 'UsuarioLabor',
  'USUARIO_LABOR': 'UsuarioLabor',

  // Medidor
  'MEDIDOR': 'Medidor',

  // Lectura Actual → LECTURA ACTUAL
  'LECTURAACTUAL': 'LecturaActual',
  'LECTURA ACTUAL': 'LecturaActual',
  'LECTURA_ACTUAL': 'LecturaActual',

  // Causa Obs. → CAUSA OBS
  'CAUSAOBS': 'CausaObs',
  'CAUSA OBS': 'CausaObs',
  'CAUSA_OBS': 'CausaObs',

  // Terminal Descarga → TERMINAL DESCARGA
  'TERMINALDESCARGA': 'TerminalDescarga',
  'TERMINAL DESCARGA': 'TerminalDescarga',
  'TERMINAL_DESCARGA': 'TerminalDescarga',

  // Grupo Trabajo → GRUPO TRABAJO
  'GRUPOTRABAJO': 'GrupoTrabajo',
  'GRUPO TRABAJO': 'GrupoTrabajo',
  'GRUPO_TRABAJO': 'GrupoTrabajo',

  // Contrato
  'CONTRATO': 'Contrato',

  // Trabajo
  'TRABAJO': 'Trabajo',

  // F. Act. Comercial → F ACT COMERCIAL (normalizeHeader quita puntos)
  'FACTCOMERCIAL': 'FActComercial',
  'F ACT COMERCIAL': 'FActComercial',
  'F_ACT_COMERCIAL': 'FActComercial',

  // Estado Comunicación → ESTADO COMUNICACION
  'ESTADOCOMUNICACION': 'EstadoComunicacion',
  'ESTADO COMUNICACION': 'EstadoComunicacion',
  'ESTADO_COMUNICACION': 'EstadoComunicacion',
  'ESTADO COMUNICACIÓN': 'EstadoComunicacion',

  // Fecha Carga → FECHA CARGA
  'FECHACARGA': 'FechaCarga',
  'FECHA CARGA': 'FechaCarga',
  'FECHA_CARGA': 'FechaCarga',

  // Fecha Descarga → FECHA DESCARGA
  'FECHADESCARGA': 'FechaDescarga',
  'FECHA DESCARGA': 'FechaDescarga',
  'FECHA_DESCARGA': 'FechaDescarga',
};

function toDigits(v) {
  const s = String(v ?? '').replace(/[^0-9]/g, '');
  return s ? s : null;
}

async function insertBatchSafe(conn, rowsObjs) {
  try {
    const sql = buildInsertSQLRevisionesSirius(rowsObjs.length);
    await conn.query(sql, rowsObjs.flatMap((r) => r.vals));
    return { inserted: rowsObjs.length, failed: [] };
  } catch (e) {
    if (rowsObjs.length === 1) {
      return { inserted: 0, failed: [rowsObjs[0].rowNo] };
    }
    const mid = Math.floor(rowsObjs.length / 2);
    const left = await insertBatchSafe(conn, rowsObjs.slice(0, mid));
    const right = await insertBatchSafe(conn, rowsObjs.slice(mid));
    return { inserted: left.inserted + right.inserted, failed: left.failed.concat(right.failed) };
  }
}

export async function loadRevisionesSiriusFile(fullPath) {
  const fileName = path.basename(fullPath);
  console.log(`[RevisionesSirius] Iniciando lectura del archivo: ${fileName}`);

  // =========================================================
  // Lectura del archivo XLS o XLSX usando la librería xlsx
  // que soporta ambos formatos nativamente.
  // cellDates: true → convierte fechas de Excel a objetos Date
  // defval: null    → celdas vacías quedan como null
  // =========================================================
  console.log('[RevisionesSirius] Leyendo archivo con xlsx...');
  const workbook = readFile(fullPath, { cellDates: true, defval: null });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convierte la hoja a array de arrays (como filas/columnas)
  // header: 1 → primera fila son los encabezados como array
  const rawRows = utils.sheet_to_json(sheet, { header: 1, defval: null });
  console.log(`[RevisionesSirius] Filas leídas del archivo: ${rawRows.length}`);

  if (rawRows.length === 0) {
    throw new Error('El archivo está vacío o no tiene datos.');
  }

  // =========================================================
  // Mapear encabezados de la primera fila
  // Igual que antes: normaliza, elimina puntos/espacios/guiones
  // y busca en el HEADER_MAP para obtener el nombre del campo
  // =========================================================
const headerRow = rawRows[0];
  const colOf = {};

  // LOG TEMPORAL: ver exactamente cómo llegan los encabezados
  console.log('[RevisionesSirius] Encabezados RAW del archivo:');
  headerRow.forEach((h, idx) => {
    const normalized = normalizeHeader(h);
    const key = normalized.replace(/[\s_]/g, '');
    console.log(`  [${idx}] raw="${h}" → normalized="${normalized}" → key="${key}"`);
  });

  headerRow.forEach((h, idx) => {
    const normalized = normalizeHeader(h);
    const key = normalized.replace(/[\s_]/g, '');
    const mapped = HEADER_MAP[key] || HEADER_MAP[normalized];
    if (mapped) colOf[mapped] = idx;
  });
 // console.log('[RevisionesSirius] Columnas mapeadas:', Object.keys(colOf));

  // Filas de datos (excluye la primera fila de encabezados)
  const dataRows = rawRows.slice(1);

  let insertedRows = 0;
  let failedRows = [];
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // =========================================================
    // PASO 1: Vaciar revisiones_sirius antes de insertar
    // los nuevos datos del archivo
    // =========================================================
    console.log('[RevisionesSirius] Vaciando tabla revisiones_sirius...');
    await conn.query('TRUNCATE TABLE revisiones_sirius');
    console.log('[RevisionesSirius] Tabla vaciada correctamente.');

    let batch = [];
    let rowsInTxn = 0;
    let rowNo = 2; // empieza en 2 porque la fila 1 es el encabezado

    for (const values of dataRows) {
      // Saltar filas completamente vacías
      if (!values || values.every(v => v === null || v === '')) {
        rowNo++;
        continue;
      }

      const get = (name) => (colOf[name] !== undefined ? values[colOf[name]] : null);

      const recordArr = [
        toInt(get('Programa')),
        toInt(get('Anio')),
        toInt(get('Mes')),
        toNull(get('Correria')),
        toInt(get('IdOrdenTrabajo')),
        toInt(get('Secuencia')),
        toInt(get('Tarea')),
        toNull(get('DescripcionTarea')),
        toInt(get('IdCliente')),
        toNull(get('Nombre')),
        toInt(get('EstadoOrden')),
        toNull(get('DescripcionEstadoOrden')),
        toNull(get('EstadoTarea')),
        toNull(get('DescripcionEstadoTarea')),
        toNull(get('Nueva')),
        toNull(get('IdNuevaComercial')),
        toNull(get('Direccion')),
        toNull(get('Revision')),
        toNull(get('TipoProg')),
        toDate(get('FechaProg')),
        toDigits(get('RutaLectura')),
        toDigits(get('Instalacion')),
        toInt(get('Ciclo')),
        toInt(get('Municipio')),
        toNull(get('NombreMunicipio')),
        toInt(get('Localidad')),
        toNull(get('NombreLocalidad')),
        toInt(get('CodRango')),
        toNull(get('Nodo')),
        toNull(get('GPS')),
        toInt(get('ClaseServicio')),
        toNull(get('DescripcionClase')),
        toInt(get('Estrato')),
        toNull(get('Vehiculo')),
        toNull(get('IndAdvertencia')),
        toNull(get('Advertencia')),
        toDate(get('FechaUltLabor')),
        toTime(get('HoraUltLabor')),
        toDigits(get('UsuarioLabor')),
        toNull(get('Medidor')),
        toInt(get('LecturaActual')),
        toNull(get('CausaObs')),
        toNull(get('TerminalDescarga')),
        toNull(get('GrupoTrabajo')),
        toInt(get('Contrato')),
        toInt(get('Trabajo')),
        toDate(get('FActComercial')),
        toNull(get('EstadoComunicacion')),
        toDate(get('FechaCarga')),
        toDate(get('FechaDescarga')),
      ];

      batch.push({ vals: recordArr, rowNo });
      rowNo++;

      if (batch.length >= BATCH_SIZE) {
        const { inserted, failed } = await insertBatchSafe(conn, batch);
        insertedRows += inserted;
        if (failed.length) failedRows.push(...failed);
        rowsInTxn += inserted;
        batch = [];

        if (rowsInTxn >= TXN_ROWS) {
          await conn.commit();
          await conn.beginTransaction();
          rowsInTxn = 0;
        }
      }
    }

    // Insertar el último batch pendiente
    if (batch.length) {
      const { inserted, failed } = await insertBatchSafe(conn, batch);
      insertedRows += inserted;
      if (failed.length) failedRows.push(...failed);
    }

    await conn.commit();
    console.log(`[RevisionesSirius] Carga finalizada. Insertadas: ${insertedRows}. Fallidas: ${failedRows.length}`);

    // =========================================================
    // PASO 2: Sincronizar revisiones_sirius → revisiones_sirius_master
    // Se llama después del commit para garantizar que todos
    // los datos ya están guardados antes de sincronizar.
    // =========================================================
    console.log('[RevisionesSirius] Iniciando sincronización con master...');
    await pool.query('CALL sp_sincronizar_master()');
    console.log('[RevisionesSirius] Sincronización con master completada.');

    return {
      ok: true,
      inserted: insertedRows,
      failedRows,
      file: fileName,
      table: 'revisiones_sirius',
    };

  } catch (err) {
    await conn.rollback();
    err.message = `Fallo cargando ${fileName} (revisiones_sirius): ` + err.message;
    throw err;
  } finally {
    conn.release();
  }
}
