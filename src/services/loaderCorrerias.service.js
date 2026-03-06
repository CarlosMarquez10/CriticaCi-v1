import Excel from 'exceljs';
import path from 'path';
import { pool } from '../connection/db.js';
import { normalizeHeader, toNull, toInt, toDate } from '../utils/normalize.js';
import { buildInsertSQLCorrerias } from '../utils/sql_correrias.js';

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);
const TXN_ROWS   = Number(process.env.TXN_ROWS || 20000);

const HEADER_MAP = {
  'CORRERIA': 'Correria',
  'DESCRIPCION': 'Descripcion',
  'OTS': 'OTs',
  'OPERADOR': 'Operador',
  'TERMINAL': 'Terminal',
  'VEHICULO': 'Vehiculo',
  'FECHAPROGRAMADA': 'FechaProgramada', 'FECHA PROGRAMADA': 'FechaProgramada',
  'FECHAPROGRAMACION': 'FechaProgramacion', 'FECHA PROGRAMACION': 'FechaProgramacion',
  'FORZARENVIO': 'ForzarEnvio', 'FORZAR ENVIO': 'ForzarEnvio',
  'PROG': 'Prog',
};

function toBool(v) {
  if (v === undefined || v === null || v === '') return false;
  const s = String(v).trim().toUpperCase();
  return s === '1' || s === 'TRUE' || s === 'SI' || s === 'S' || s === 'YES' || s === 'VERDADERO';
}

async function insertBatchSafe(conn, rowsObjs) {
  try {
    const sql = buildInsertSQLCorrerias(rowsObjs.length);
    await conn.query(sql, rowsObjs.flatMap((r) => r.vals));
    // Con ON DUPLICATE KEY UPDATE ya no hay errores por duplicados,
    // todos los registros del batch se procesan correctamente.
    return { inserted: rowsObjs.length, failed: [] };
  } catch (e) {
    // Si aún así falla por otro motivo, divide el batch a la mitad
    // y reintenta cada parte por separado para aislar el error.
    if (rowsObjs.length === 1) {
      return { inserted: 0, failed: [rowsObjs[0].rowNo] };
    }
    const mid = Math.floor(rowsObjs.length / 2);
    const left = await insertBatchSafe(conn, rowsObjs.slice(0, mid));
    const right = await insertBatchSafe(conn, rowsObjs.slice(mid));
    return { inserted: left.inserted + right.inserted, failed: left.failed.concat(right.failed) };
  }
}

export async function loadCorreriasFile(fullPath) {
  const fileName = path.basename(fullPath);
  console.log(`[Correrias] Iniciando lectura del archivo: ${fileName}`);

  const workbookReader = new Excel.stream.xlsx.WorkbookReader(fullPath, {
    entries: 'emit', sharedStrings: 'cache', styles: 'emit', worksheets: 'emit',
  });

  let insertedRows = 0;
  let failedRows = [];
  const conn = await pool.getConnection();

  try {
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
            const key = h.replace(/[\s_]/g, '');
            const mapped = HEADER_MAP[key] || HEADER_MAP[h];
            if (mapped) colOf[mapped] = idx;
          });
          console.log('[Correrias] Columnas mapeadas:', Object.keys(colOf));
          headerReady = true;
          continue;
        }

        const get = (name) => values[colOf[name]];

        const recordArr = [
          toNull(get('Correria')),
          toNull(get('Descripcion')),
          toInt(get('OTs')),
          toInt(get('Operador')),
          toNull(get('Terminal')),
          toNull(get('Vehiculo')),
          toDate(get('FechaProgramada')),
          toDate(get('FechaProgramacion')),
          toBool(get('ForzarEnvio')),
          toBool(get('Prog')),
        ];

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

      // Insertar el último batch que quedó pendiente
      if (batch.length) {
        const { inserted, failed } = await insertBatchSafe(conn, batch);
        insertedRows += inserted;
        if (failed.length) failedRows.push(...failed);
      }
    }

    await conn.commit();
    console.log(`[Correrias] Finalizado. Insertadas/Actualizadas: ${insertedRows}. Fallidas: ${failedRows.length}`);

    return {
      ok: true,
      inserted: insertedRows,
      failedRows,
      file: fileName,
      table: 'correrias',
    };

  } catch (err) {
    await conn.rollback();
    err.message = `Fallo cargando ${fileName} (correrias): ` + err.message;
    throw err;
  } finally {
    conn.release();
  }
}