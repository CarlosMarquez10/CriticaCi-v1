// Servicio de carga de clientes desde Excel (stub inicial)
import Excel from 'exceljs';
import path from 'path';
import { pool } from '../connection/db.js';
import { normalizeHeader, toNull, toInt } from '../utils/normalize.js';
import { buildInsertSQLClientes } from '../utils/sql_clientes.js';

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);
const TXN_ROWS   = Number(process.env.TXN_ROWS || 20000);

// Encabezados normalizados del Excel -> columnas de la tabla `clientes`
const HEADER_MAP = {
  'CLIENTE': 'CLIENTE_ID', 'CLIENTE_ID': 'CLIENTE_ID',
  'NOMBRE': 'NOMBRE', 'NOMBRE CLIENTE': 'NOMBRE',
  'NIT': 'NIT',
  'TELEFONO': 'TELEFONO', 'TEL FIJO': 'TELEFONO',
  'TELEFONO CELULAR': 'TELEFONO_CELULAR', 'TELEFONO_CELULAR': 'TELEFONO_CELULAR',
  'TELEFONO REGISTRO': 'TELEFONO_REGISTRO', 'TELEFONO_REGISTRO': 'TELEFONO_REGISTRO',
  'CORREO': 'CORREO', 'CORREO ELECTRONICO': 'CORREO', 'EMAIL': 'CORREO',
  'ZONA': 'ZONA',
  'CICLO': 'CICLO',
  'RUTA REPARTO': 'RUTA_REPARTO', 'RUTA_REPARTO': 'RUTA_REPARTO',
  'RUTA LECTURA': 'RUTA_LECTURA', 'RUTA_LECTURA': 'RUTA_LECTURA',
  'SECCION': 'SECCION',
  'ORDEN': 'ORDEN',
  'MUNICIPIO': 'MUNICIPIO',
  'DESC MUNICIPIO': 'DESC_MUNICIPIO', 'DESCRIPCION MUNICIPIO': 'DESC_MUNICIPIO', 'DESC_MUNICIPIO': 'DESC_MUNICIPIO',
  'BARRIO': 'BARRIO',
  'DIRECCION': 'DIRECCION',
  'CENTRO POBLADO': 'CENTRO_POBLADO', 'CENTRO_POBLADO': 'CENTRO_POBLADO',
  'FICHA CATASTRAL': 'FICHA_CATASTRAL', 'FICHA_CATASTRAL': 'FICHA_CATASTRAL',
  'MATRICULA INMOBILIARIA': 'MATRICULA_INMOBILIARIA', 'MATRICULA_INMOBILIARIA': 'MATRICULA_INMOBILIARIA',
  'ESTRATO': 'ESTRATO',
  'CLASE SERVICIO': 'CLASE_SERVICIO', 'CLASE_SERVICIO': 'CLASE_SERVICIO',
  'NUMERO MEDIDOR': 'NUMERO_MEDIDOR', 'NUMERO_MEDIDOR': 'NUMERO_MEDIDOR', 'MEDIDOR': 'NUMERO_MEDIDOR',
  'MARCA MEDIDOR': 'MARCA_MEDIDOR', 'MARCA_MEDIDOR': 'MARCA_MEDIDOR',
  'TECNOLOGIA MEDIDOR': 'TECNOLOGIA_MEDIDOR', 'TECNOLOGIA_MEDIDOR': 'TECNOLOGIA_MEDIDOR',
  'D TECNOLOGIA MEDIDOR': 'D_TECNOLOGIA_MEDIDOR', 'D_TECNOLOGIA_MEDIDOR': 'D_TECNOLOGIA_MEDIDOR', 'DESC TECNOLOGIA MEDIDOR': 'D_TECNOLOGIA_MEDIDOR',
  'TIPO REGISTRADOR': 'TIPO_REGISTRADOR', 'TIPO_REGISTRADOR': 'TIPO_REGISTRADOR',
  'D TIPO REGISTRADOR': 'D_TIPO_REGISTRADOR', 'D_TIPO_REGISTRADOR': 'D_TIPO_REGISTRADOR',
  'UBICACION': 'UBICACION',
  'GPS LATITUD': 'GPS_LATITUD', 'GPS_LATITUD': 'GPS_LATITUD', 'LATITUD': 'GPS_LATITUD',
  'GPS LONGITUD': 'GPS_LONGITUD', 'GPS_LONGITUD': 'GPS_LONGITUD', 'LONGITUD': 'GPS_LONGITUD',
  'GPS ALTITUD': 'GPS_ALTITUD', 'GPS_ALTITUD': 'GPS_ALTITUD', 'ALTITUD': 'GPS_ALTITUD',
  'ESTADO CLIENTE': 'ESTADO_CLIENTE', 'ESTADO_CLIENTE': 'ESTADO_CLIENTE', 'ESTADO': 'ESTADO_CLIENTE',
  'TRANSFORMADOR': 'TRANSFORMADOR',
  'ALIMENTADOR': 'ALIMENTADOR',
  'CODIGO EXTERNO': 'CODIGO_EXTERNO', 'CODIGO_EXTERNO': 'CODIGO_EXTERNO', 'COD EXTERNO': 'CODIGO_EXTERNO',
  'COD CIU': 'COD_CIU', 'CODIGO CIU': 'COD_CIU', 'COD_CIU': 'COD_CIU'
};

function toDigits(v) {
  const s = String(v ?? '').replace(/[^0-9]/g, '');
  return s ? s : null;
}

function toDecimal(v) {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v).replace(',', '.');
  const n = Number(s.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

async function insertBatchSafe(conn, rowsObjs) {
  try {
    const sql = buildInsertSQLClientes(rowsObjs.length);
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

export async function loadClientesFile(fullPath) {
  const fileName = path.basename(fullPath);
  const workbookReader = new Excel.stream.xlsx.WorkbookReader(fullPath, {
    entries: 'emit', sharedStrings: 'cache', styles: 'emit', worksheets: 'emit',
  });

  let insertedRows = 0;
  let failedRows = [];
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    for await (const worksheetReader of workbookReader) {
      let headerReady = false; let colOf = {}; let batch = []; let rowsInTxn = 0;
      for await (const row of worksheetReader) {
        const values = row.values || [];
        if (!headerReady) {
          const headers = values.map((v) => normalizeHeader(v));
          headers.forEach((h, idx) => { const mapped = HEADER_MAP[h]; if (mapped) colOf[mapped] = idx; });
          headerReady = true; continue;
        }
        const get = (name) => values[colOf[name]];
        const recordArr = [
          toDigits(get('CLIENTE_ID')),
          toNull(get('NOMBRE')),
          toNull(get('NIT')),
          toNull(get('TELEFONO')),
          toNull(get('TELEFONO_CELULAR')),
          toNull(get('TELEFONO_REGISTRO')),
          toNull(get('CORREO')),
          toNull(get('ZONA')),
          toNull(get('CICLO')),
          toNull(get('RUTA_REPARTO')),
          toNull(get('RUTA_LECTURA')),
          toNull(get('SECCION')),
          toNull(get('ORDEN')),
          toNull(get('MUNICIPIO')),
          toNull(get('DESC_MUNICIPIO')),
          toNull(get('BARRIO')),
          toNull(get('DIRECCION')),
          toNull(get('CENTRO_POBLADO')),
          toNull(get('FICHA_CATASTRAL')),
          toNull(get('MATRICULA_INMOBILIARIA')),
          toInt(get('ESTRATO')),
          toNull(get('CLASE_SERVICIO')),
          toNull(get('NUMERO_MEDIDOR')),
          toNull(get('MARCA_MEDIDOR')),
          toNull(get('TECNOLOGIA_MEDIDOR')),
          toNull(get('D_TECNOLOGIA_MEDIDOR')),
          toNull(get('TIPO_REGISTRADOR')),
          toNull(get('D_TIPO_REGISTRADOR')),
          toNull(get('UBICACION')),
          toDecimal(get('GPS_LATITUD')),
          toDecimal(get('GPS_LONGITUD')),
          toInt(get('GPS_ALTITUD')),
          toInt(get('ESTADO_CLIENTE')),
          toNull(get('TRANSFORMADOR')),
          toNull(get('ALIMENTADOR')),
          toNull(get('CODIGO_EXTERNO')),
          toNull(get('COD_CIU')),
        ];
        batch.push({ vals: recordArr, rowNo: row.number });
        if (batch.length >= BATCH_SIZE) {
          const { inserted, failed } = await insertBatchSafe(conn, batch);
          insertedRows += inserted; if (failed.length) failedRows.push(...failed); rowsInTxn += inserted; batch = [];
          if (rowsInTxn >= TXN_ROWS) { await conn.commit(); await conn.beginTransaction(); rowsInTxn = 0; }
        }
      }
      if (batch.length) {
        const { inserted, failed } = await insertBatchSafe(conn, batch);
        insertedRows += inserted; if (failed.length) failedRows.push(...failed); rowsInTxn += inserted; batch = [];
      }
    }
    await conn.commit();
    return { ok: true, inserted: insertedRows, failedRows, file: fileName, table: 'clientes' };
  } catch (err) {
    await conn.rollback(); err.message = `Fallo cargando ${fileName} (clientes): ` + err.message; throw err;
  } finally { conn.release(); }
}