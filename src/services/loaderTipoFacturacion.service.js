// Servicio de carga de TipoFacturacion desde Excel (stub inicial)
import Excel from 'exceljs';
import path from 'path';
import { pool } from '../connection/db.js';
import { normalizeHeader, toNull, toInt } from '../utils/normalize.js';
import { buildInsertSQLTipoFacturacion } from '../utils/sql_tipofacturacion.js';

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);
const TXN_ROWS   = Number(process.env.TXN_ROWS || 20000);
const PROGRESS_EVERY = Number(process.env.PROGRESS_EVERY || 1000);

const HEADER_MAP = {
  'REGIONAL': 'REGIONAL',
  'DEPARTAMENTO': 'DEPARTAMENTO',
  'MUNICIPIO': 'MUNICIPIO',
  'BARRIO': 'BARRIO',
  'CLASE_SERVICIO': 'CLASE_SERVICIO',
  'CLASE_SER': 'CLASE_SERVICIO',
  'COD_TARIFA': 'COD_TARIFA',
  'COD_TARIF': 'COD_TARIFA',
  'TARIFA': 'TARIFA',
  'ESTRATO': 'ESTRATO',
  'AREA': 'AREA',
  'CICLO': 'CICLO',
  'CLIENTE': 'CLIENTE_ID',
  'CLIENTE_ID': 'CLIENTE_ID',
  'NOMBRE': 'NOMBRE',
  'DIRECCION': 'DIRECCION',
  'DIRECCION_MEDIO': 'DIRECCION_MEDIO',
  'MUNICIPIO_POSTAL': 'MUNICIPIO_POSTAL',
  'CORREO_ELECTRONICO': 'CORREO_ELECTRONICO',
  'CORREO_EL': 'CORREO_ELECTRONICO',
  'TIPO_FACTURACION': 'TIPO_FACTURACION',
  'TIPO_FACTU': 'TIPO_FACTURACION',
  'AUTORIZA_DATOS': 'AUTORIZA_DATOS',
  'AUTORIZA_D': 'AUTORIZA_DATOS',
  'TIPO_RECIBO': 'TIPO_RECIBO',
  'TIPO_RECIB': 'TIPO_RECIB',
  'USER_SISTEMA': 'USER_SISTEMA',
  'USER_SISTE': 'USER_SISTEMA',
  'FECHA_SISTEMA': 'FECHA_SISTEMA',
  'FECHA_SIST': 'FECHA_SISTEMA',
  'CAMBIO_DATOS': 'CAMBIO_DATOS'
};

async function insertBatchSafe(conn, rowsObjs) {
  try {
    const sql = buildInsertSQLTipoFacturacion(rowsObjs.length);
    await conn.query(sql, rowsObjs.flatMap((r) => r.vals));
    return { inserted: rowsObjs.length, failed: [] };
  } catch (e) {
    console.error(
      `[TipoFacturacion][INSERT ERROR] batchSize=${rowsObjs.length} -> ${e.code || ''} ${e.message}`
    );
    if (rowsObjs.length === 1) {
      const one = rowsObjs[0];
      console.error('[TipoFacturacion][FILA FALLIDA] excelRow=%s valores=%j', one.rowNo, one.vals);
      return { inserted: 0, failed: [rowsObjs[0].rowNo] };
    }
    const mid = Math.floor(rowsObjs.length / 2);
    const left = await insertBatchSafe(conn, rowsObjs.slice(0, mid));
    const right = await insertBatchSafe(conn, rowsObjs.slice(mid));
    return { inserted: left.inserted + right.inserted, failed: left.failed.concat(right.failed) };
  }
}

export async function loadTipoFacturacionFile(fullPath) {
  const fileName = path.basename(fullPath);
  const workbookReader = new Excel.stream.xlsx.WorkbookReader(fullPath, {
    entries: 'emit', sharedStrings: 'cache', styles: 'emit', worksheets: 'emit',
  });

  console.log(`[TipoFacturacion] Iniciando carga del archivo: ${fileName}`);
  let insertedRows = 0; let failedRows = []; let totalRows = 0; let nullClienteCount = 0; let nonNullClienteCount = 0;
  const conn = await pool.getConnection();
  const disableFK = String(process.env.DISABLE_FK_TIPOFACTURACION || '').trim() === '1';

  try {
    if (disableFK) {
      console.warn('[TipoFacturacion] Deshabilitando FOREIGN_KEY_CHECKS en esta sesión durante la carga');
      await conn.query('SET FOREIGN_KEY_CHECKS=0');
    }
    await conn.beginTransaction();
    for await (const worksheetReader of workbookReader) {
      let headerReady = false; let colOf = {}; let batch = []; let rowsInTxn = 0;
      for await (const row of worksheetReader) {
        const values = row.values || [];
        if (!headerReady) {
          const headers = values.map((v) => normalizeHeader(v));
          headers.forEach((h, idx) => { const mapped = HEADER_MAP[h]; if (mapped) colOf[mapped] = idx; });
          console.log('[TipoFacturacion] Encabezados originales:', values);
          console.log('[TipoFacturacion] Encabezados normalizados:', headers);
          console.log('[TipoFacturacion] Columnas mapeadas:', Object.keys(colOf));
          const required = ['CLIENTE_ID','TIPO_FACTURACION'];
          const missing = required.filter((k) => colOf[k] === undefined);
          if (missing.length) {
            console.warn('[TipoFacturacion] Faltan columnas requeridas:', missing);
          } else {
            console.log('[TipoFacturacion] Columnas requeridas presentes');
          }
          headerReady = true; continue;
        }
        const get = (name) => values[colOf[name]];
        const clientIdVal = toInt(get('CLIENTE_ID')); 
        if (clientIdVal === null) nullClienteCount++; else nonNullClienteCount++;
        
        const recordArr = [
          toNull(get('REGIONAL')),
          toNull(get('DEPARTAMENTO')),
          toNull(get('MUNICIPIO')),
          toNull(get('BARRIO')),
          toNull(get('CLASE_SERVICIO')),
          toNull(get('COD_TARIFA')),
          toNull(get('TARIFA')),
          toInt(get('ESTRATO')),
          toNull(get('AREA')),
          toNull(get('CICLO')),
          clientIdVal,
          toNull(get('NOMBRE')),
          toNull(get('DIRECCION')),
          toNull(get('DIRECCION_MEDIO')),
          toNull(get('MUNICIPIO_POSTAL')),
          toNull(get('CORREO_ELECTRONICO')),
          toNull(get('TIPO_FACTURACION')),
          toNull(get('AUTORIZA_DATOS')),
          toNull(get('TIPO_RECIBO')),
          toNull(get('USER_SISTEMA')),
          toNull(get('FECHA_SISTEMA')),
          toNull(get('CAMBIO_DATOS'))
        ];
        batch.push({ vals: recordArr, rowNo: row.number });
        totalRows += 1;
        if (PROGRESS_EVERY > 0 && totalRows % PROGRESS_EVERY === 0) {
          console.log(`[TipoFacturacion] Progreso: ${totalRows} filas leídas...`);
        }
        if (batch.length >= BATCH_SIZE) {
          const { inserted, failed } = await insertBatchSafe(conn, batch);
          insertedRows += inserted; if (failed.length) failedRows.push(...failed); rowsInTxn += inserted; batch = [];
          console.log(`[TipoFacturacion] Lote insertado: ${inserted} filas (acumuladas: ${insertedRows})`);
          if (rowsInTxn >= TXN_ROWS) { await conn.commit(); await conn.beginTransaction(); rowsInTxn = 0; }
        }
      }
      if (batch.length) {
        const { inserted, failed } = await insertBatchSafe(conn, batch);
        insertedRows += inserted; if (failed.length) failedRows.push(...failed); rowsInTxn += inserted; batch = [];
        console.log(`[TipoFacturacion] Último lote insertado: ${inserted} filas (total: ${insertedRows})`);
      }
    }
    await conn.commit();
    console.log(`[TipoFacturacion] Finalizado. Filas leídas: ${totalRows}, insertadas: ${insertedRows}, fallidas: ${failedRows.length}`);
    console.log(`[TipoFacturacion] CLIENTE_ID nulo: ${nullClienteCount}, no nulo: ${nonNullClienteCount}`);
    return { ok: true, inserted: insertedRows, failedRows, file: fileName, table: 'TipoFacturacion' };
  } catch (err) {
    console.error('[TipoFacturacion] Error durante la carga:', err);
    await conn.rollback(); err.message = `Fallo cargando ${fileName} (TipoFacturacion): ` + err.message; throw err;
  } finally {
    try {
      if (disableFK) {
        await conn.query('SET FOREIGN_KEY_CHECKS=1');
        console.warn('[TipoFacturacion] FOREIGN_KEY_CHECKS restaurado para la sesión');
      }
    } catch (e) {
      console.error('[TipoFacturacion] Error restaurando FOREIGN_KEY_CHECKS:', e.message);
    }
    conn.release();
  }
}