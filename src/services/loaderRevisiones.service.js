import Excel from 'exceljs';
import path from 'path';
import { pool } from '../connection/db.js';
import { normalizeHeader, toNull } from '../utils/normalize.js';
import { buildInsertSQLRevisiones } from '../utils/sql_revisiones.js';

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);
const TXN_ROWS = Number(process.env.TXN_ROWS || 20000);

// Mapeo de encabezados Excel -> columnas de la tabla clientes_servicios
const HEADER_MAP = {
  'CLIENTE': 'CLIENTE_ID', 'CLIENTE_ID': 'CLIENTE_ID',
  'NOMBRE': 'NOMBRE', 'NOMBRE CLIENTE': 'NOMBRE',
  'DIRECCION': 'DIRECCION',
  'MUNICIPIO': 'MUNICIPIO',
  'CICLO': 'CICLO',
  'CLASE SERVICIO': 'CLASE_SERVICIO', 'CLASE_SERVICIO': 'CLASE_SERVICIO',
  'TARIFA': 'TARIFA',
  'ESTRATO': 'ESTRATO',
  'ESTADO SUMINISTRO': 'ESTADO_SUMINISTRO', 'ESTADO_SUMINISTRO': 'ESTADO_SUMINISTRO',
  'RUTA LECTURA': 'RUTA_LECTURA', 'RUTA_LECTURA': 'RUTA_LECTURA',
  // Medidor R
  'SERIE R': 'SERIE_R', 'SERIE_R': 'SERIE_R',
  'MARCA R': 'MARCA_R', 'MARCA_R': 'MARCA_R',
  'FACTOR MUL R': 'FACTOR_MUL_R', 'FACTOR_MUL_R': 'FACTOR_MUL_R',
  'UBICACION R': 'UBICACION_R', 'UBICACION_R': 'UBICACION_R',
  'PROPIEDAD R': 'PROPIEDAD_R', 'PROPIEDAD_R': 'PROPIEDAD_R',
  'ACCION MEDIDOR R': 'ACCION_MEDIDOR_R', 'ACCION_MEDIDOR_R': 'ACCION_MEDIDOR_R',
  'LECTURA R': 'LECTURA_R', 'LECTURA_R': 'LECTURA_R',
  'OBS CONSUMO R': 'OBS_CONSUMO_R', 'OBS_CONSUMO_R': 'OBS_CONSUMO_R',
  'CAUSA NO LECTURA R': 'CAUSA_NO_LECTURA_R', 'CAUSA_NO_LECTURA_R': 'CAUSA_NO_LECTURA_R',
  // Medidor I
  'SERIE I': 'SERIE_I', 'SERIE_I': 'SERIE_I',
  'MARCA I': 'MARCA_I', 'MARCA_I': 'MARCA_I',
  'FACTOR MUL I': 'FACTOR_MUL_I', 'FACTOR_MUL_I': 'FACTOR_MUL_I',
  'UBICACION I': 'UBICACION_I', 'UBICACION_I': 'UBICACION_I',
  'PROPIEDAD I': 'PROPIEDAD_I', 'PROPIEDAD_I': 'PROPIEDAD_I',
  'ACCION MEDIDOR I': 'ACCION_MEDIDOR_I', 'ACCION_MEDIDOR_I': 'ACCION_MEDIDOR_I',
  'LECTURA I': 'LECTURA_I', 'LECTURA_I': 'LECTURA_I',
  'OBS CONSUMO I': 'OBS_CONSUMO_I', 'OBS_CONSUMO_I': 'OBS_CONSUMO_I',
  'CAUSA NO LECTURA I': 'CAUSA_NO_LECTURA_I', 'CAUSA_NO_LECTURA_I': 'CAUSA_NO_LECTURA_I',
  // Medidor T
  'SERIE T': 'SERIE_T', 'SERIE_T': 'SERIE_T',
  'MARCA T': 'MARCA_T', 'MARCA_T': 'MARCA_T',
  'FACTOR MUL T': 'FACTOR_MUL_T', 'FACTOR_MUL_T': 'FACTOR_MUL_T',
  'UBICACION T': 'UBICACION_T', 'UBICACION_T': 'UBICACION_T',
  'PROPIEDAD T': 'PROPIEDAD_T', 'PROPIEDAD_T': 'PROPIEDAD_T',
  'ACCION MEDIDOR T': 'ACCION_MEDIDOR_T', 'ACCION_MEDIDOR_T': 'ACCION_MEDIDOR_T',
  'LECTURA T': 'LECTURA_T', 'LECTURA_T': 'LECTURA_T',
  'OBS CONSUMO T': 'OBS_CONSUMO_T', 'OBS_CONSUMO_T': 'OBS_CONSUMO_T',
  'CAUSA NO LECTURA T': 'CAUSA_NO_LECTURA_T', 'CAUSA_NO_LECTURA_T': 'CAUSA_NO_LECTURA_T',
  // Medidor X
  'SERIE X': 'SERIE_X', 'SERIE_X': 'SERIE_X',
  'MARCA X': 'MARCA_X', 'MARCA_X': 'MARCA_X',
  'FACTOR MUL X': 'FACTOR_MUL_X', 'FACTOR_MUL_X': 'FACTOR_MUL_X',
  'UBICACION X': 'UBICACION_X', 'UBICACION_X': 'UBICACION_X',
  'PROPIEDAD X': 'PROPIEDAD_X', 'PROPIEDAD_X': 'PROPIEDAD_X',
  'ACCION MEDIDOR X': 'ACCION_MEDIDOR_X', 'ACCION_MEDIDOR_X': 'ACCION_MEDIDOR_X',
  'LECTURA X': 'LECTURA_X', 'LECTURA_X': 'LECTURA_X',
  'OBS CONSUMO X': 'OBS_CONSUMO_X', 'OBS_CONSUMO_X': 'OBS_CONSUMO_X',
  'CAUSA NO LECTURA X': 'CAUSA_NO_LECTURA_X', 'CAUSA_NO_LECTURA_X': 'CAUSA_NO_LECTURA_X',
  // Datos de revisión
  'NUMERO REVISION': 'NUMERO_REVISION', 'NUMERO_REVISION': 'NUMERO_REVISION',
  'ESTADO REVISION': 'ESTADO_REVISION', 'ESTADO_REVISION': 'ESTADO_REVISION',
  'TIPO PROCESO': 'TIPO_PROCESO', 'TIPO_PROCESO': 'TIPO_PROCESO',
  'NUMERO PROCESO': 'NUMERO_PROCESO', 'NUMERO_PROCESO': 'NUMERO_PROCESO',
  'ESTADO PROCESO': 'ESTADO_PROCESO', 'ESTADO_PROCESO': 'ESTADO_PROCESO',
  'NUEVA': 'NUEVA',
  'TIPO': 'TIPO',
  'D TIPO': 'D_TIPO', 'D_TIPO': 'D_TIPO',
  'GRUPO REV': 'GRUPO_REV', 'GRUPO_REV': 'GRUPO_REV',
  'MOTIVO': 'MOTIVO',
  'D MOTIVO': 'D_MOTIVO', 'D_MOTIVO': 'D_MOTIVO',
  // Fechas y usuarios
  'FECHA SOLICITUD': 'FECHA_SOLICITUD', 'FECHA_SOLICITUD': 'FECHA_SOLICITUD',
  'FECHA REVISION': 'FECHA_REVISION', 'FECHA_REVISION': 'FECHA_REVISION',
  'FECHA SISTEMA': 'FECHA_SISTEMA', 'FECHA_SISTEMA': 'FECHA_SISTEMA',
  'REVISOR': 'REVISOR',
  'D REVISOR': 'D_REVISOR', 'D_REVISOR': 'D_REVISOR',
  'GENERADO POR': 'GENERADO_POR', 'GENERADO_POR': 'GENERADO_POR',
  'USER SISTEMA': 'USER_SISTEMA', 'USER_SISTEMA': 'USER_SISTEMA',
  // Estado y terminal
  'IDESTADO': 'IDESTADO',
  'TERMINALDESCARGA': 'TERMINALDESCARGA', 'TERMINAL DESCARGA': 'TERMINALDESCARGA',
  'FECHAULTLABOR': 'FECHAULTLABOR', 'FECHA ULT LABOR': 'FECHAULTLABOR',
  'CORRERIA': 'CORRERIA',
  'FECHAINICIOLABOR': 'FECHAINICIOLABOR', 'FECHA INICIO LABOR': 'FECHAINICIOLABOR',
  'FECHAFINJORNADA': 'FECHAFINJORNADA', 'FECHA FIN JORNADA': 'FECHAFINJORNADA',
  'OBSERVACION': 'OBSERVACION',
  'D OBSERVACION': 'D_OBSERVACION', 'D_OBSERVACION': 'D_OBSERVACION',
  'OBSREVISION': 'OBSREVISION', 'OBS REVISION': 'OBSREVISION',
  // Otros campos
  'TRANSFORMADOR': 'TRANSFORMADOR',
  'PROGRAMA DE INGRESO': 'PROGRAMA_DE_INGRESO', 'PROGRAMA_DE_INGRESO': 'PROGRAMA_DE_INGRESO',
  // Campo ignorado (existe en Excel pero no se inserta en BD)
  'FECHAHORAINICIAL': 'FECHAHORAINICIAL', 'FECHA HORA INICIAL': 'FECHAHORAINICIAL',
};

function toDigits(v) {
  const s = String(v ?? '').replace(/[^0-9]/g, '');
  return s ? s : null;
}

async function insertBatchSafe(conn, rowsObjs) {
  try {
    const sql = buildInsertSQLRevisiones(rowsObjs.length);
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

export async function loadRevisionesFile(fullPath) {
  const fileName = path.basename(fullPath);
  const workbookReader = new Excel.stream.xlsx.WorkbookReader(fullPath, {
    entries: 'emit', sharedStrings: 'cache', styles: 'emit', worksheets: 'emit',
  });

  let insertedRows = 0;
  let failedRows = [];
  let skippedDuplicates = 0;
  const conn = await pool.getConnection();

  try {
    // Cargar NUMERO_REVISION existentes para evitar duplicados
    const [existingRows] = await conn.query(
      'SELECT NUMERO_REVISION FROM clientes_servicios WHERE NUMERO_REVISION IS NOT NULL'
    );
    const existingRevisions = new Set(existingRows.map(r => String(r.NUMERO_REVISION)));
    const seenInFile = new Set();

    await conn.beginTransaction();
    for await (const worksheetReader of workbookReader) {
      let headerReady = false;
      let colOf = {};
      let batch = [];
      let rowsInTxn = 0;

      for await (const row of worksheetReader) {
        const values = row.values || [];
        if (!headerReady) {
          const headers = values.map((v) => normalizeHeader(v));
          headers.forEach((h, idx) => {
            const mapped = HEADER_MAP[h];
            if (mapped) colOf[mapped] = idx;
          });
          headerReady = true;
          continue;
        }

        const get = (name) => values[colOf[name]];
        const recordArr = [
          toDigits(get('CLIENTE_ID')),
          toNull(get('NOMBRE')),
          toNull(get('DIRECCION')),
          toNull(get('MUNICIPIO')),
          toNull(get('CICLO')),
          toNull(get('CLASE_SERVICIO')),
          toNull(get('TARIFA')),
          toNull(get('ESTRATO')),
          toNull(get('ESTADO_SUMINISTRO')),
          toNull(get('RUTA_LECTURA')),
          // Medidor R
          toNull(get('SERIE_R')),
          toNull(get('MARCA_R')),
          toNull(get('FACTOR_MUL_R')),
          toNull(get('UBICACION_R')),
          toNull(get('PROPIEDAD_R')),
          toNull(get('ACCION_MEDIDOR_R')),
          toNull(get('LECTURA_R')),
          toNull(get('OBS_CONSUMO_R')),
          toNull(get('CAUSA_NO_LECTURA_R')),
          // Medidor I
          toNull(get('SERIE_I')),
          toNull(get('MARCA_I')),
          toNull(get('FACTOR_MUL_I')),
          toNull(get('UBICACION_I')),
          toNull(get('PROPIEDAD_I')),
          toNull(get('ACCION_MEDIDOR_I')),
          toNull(get('LECTURA_I')),
          toNull(get('OBS_CONSUMO_I')),
          toNull(get('CAUSA_NO_LECTURA_I')),
          // Medidor T
          toNull(get('SERIE_T')),
          toNull(get('MARCA_T')),
          toNull(get('FACTOR_MUL_T')),
          toNull(get('UBICACION_T')),
          toNull(get('PROPIEDAD_T')),
          toNull(get('ACCION_MEDIDOR_T')),
          toNull(get('LECTURA_T')),
          toNull(get('OBS_CONSUMO_T')),
          toNull(get('CAUSA_NO_LECTURA_T')),
          // Medidor X
          toNull(get('SERIE_X')),
          toNull(get('MARCA_X')),
          toNull(get('FACTOR_MUL_X')),
          toNull(get('UBICACION_X')),
          toNull(get('PROPIEDAD_X')),
          toNull(get('ACCION_MEDIDOR_X')),
          toNull(get('LECTURA_X')),
          toNull(get('OBS_CONSUMO_X')),
          toNull(get('CAUSA_NO_LECTURA_X')),
          // Datos de revisión
          toNull(get('NUMERO_REVISION')),
          toNull(get('ESTADO_REVISION')),
          toNull(get('TIPO_PROCESO')),
          toNull(get('NUMERO_PROCESO')),
          toNull(get('ESTADO_PROCESO')),
          toNull(get('NUEVA')),
          toNull(get('TIPO')),
          toNull(get('D_TIPO')),
          toNull(get('GRUPO_REV')),
          toNull(get('MOTIVO')),
          toNull(get('D_MOTIVO')),
          // Fechas y usuarios
          toNull(get('FECHA_SOLICITUD')),
          toNull(get('FECHA_REVISION')),
          toNull(get('FECHA_SISTEMA')),
          toNull(get('REVISOR')),
          toNull(get('D_REVISOR')),
          toNull(get('GENERADO_POR')),
          toNull(get('USER_SISTEMA')),
          // Estado y terminal
          toNull(get('IDESTADO')),
          toNull(get('TERMINALDESCARGA')),
          toNull(get('FECHAULTLABOR')),
          toNull(get('CORRERIA')),
          toNull(get('FECHAINICIOLABOR')),
          toNull(get('FECHAFINJORNADA')),
          toNull(get('OBSERVACION')),
          toNull(get('D_OBSERVACION')),
          toNull(get('OBSREVISION')),
          // Otros campos
          toNull(get('TRANSFORMADOR')),
          toNull(get('PROGRAMA_DE_INGRESO')),
        ];

        // Verificar duplicados por NUMERO_REVISION
        const numeroRevision = toNull(get('NUMERO_REVISION'));
        const numRevStr = numeroRevision != null ? String(numeroRevision) : null;

        if (numRevStr != null) {
          // Omitir si ya existe en la BD o ya fue visto en este archivo
          if (existingRevisions.has(numRevStr) || seenInFile.has(numRevStr)) {
            skippedDuplicates++;
            continue;
          }
          seenInFile.add(numRevStr);
        }

        batch.push({ vals: recordArr, rowNo: row.number });

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

      if (batch.length) {
        const { inserted, failed } = await insertBatchSafe(conn, batch);
        insertedRows += inserted;
        if (failed.length) failedRows.push(...failed);
      }
    }

    await conn.commit();
    return { ok: true, inserted: insertedRows, skippedDuplicates, failedRows, file: fileName, table: 'clientes_servicios' };
  } catch (err) {
    await conn.rollback();
    err.message = `Fallo cargando ${fileName} (revisiones): ` + err.message;
    throw err;
  } finally {
    conn.release();
  }
}
