// src/services/loader.service.js
// este modulo se usa para cargar los datos desde el excel del los tiempos a la base de datos.
import Excel from "exceljs";
import path from "path";
import { pool } from "../connection/db.js";
import {
  normalizeHeader,
  toNull,
  toInt,
  toDate,
  toTime,
} from "../utils/normalize.js";
import { buildInsertSQL } from "../utils/sql.js";

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);
const TXN_ROWS   = Number(process.env.TXN_ROWS || 20000);

// Encabezado Excel -> columna destino
const HEADER_MAP = {
  'CORRERIA':'CORRERIA',
  'INSTALACION':'INSTALACION',
  'CLIENTE':'CLIENTE',
  'MEDIDOR':'MEDIDOR',
  'LECTOR':'LECTOR',
  'ANO':'ANO','ANIO':'ANO','AÑO':'ANO',
  'MES':'MES',
  'CICLO':'CICLO',
  'ZONA':'ZONA',
  'FECHAULTLABOR':'FECHAULTLABOR','FECHA_ULT_LABOR':'FECHAULTLABOR',
  'HORAULTLABOR':'HORAULTLABOR','HORA_ULT_LABOR':'HORAULTLABOR',
  'CODTAREA':'CODTAREA',
  'LECTURA_ACT':'LECTURA_ACTUAL','LECTURA_ACTUAL':'LECTURA_ACTUAL',
  'INTENTOS':'INTENTOS',
  'CODCAUSAOBS':'CODCAUSAOBS',
  'OBS_PREDIO':'OBS_PREDIO',
  'OBS_TEXTO':'OBS_TEXTO',
  'NUEVA':'NUEVA',
  'COORDENADAS':'COORDENADAS',
  'SECUENCIA':'SECUENCIA',
  'ENTEROS':'ENTEROS',
  'DECIMALES':'DECIMALES',
  'SERVICIO':'SERVICIO',
  'UBICACION':'UBICACION',
};

// Inserta el lote; si falla, divide en 2 hasta aislar la(s) fila(s) mala(s)
async function insertBatchSafe(conn, rowsObjs, buildInsertSQLFn) {
  try {
    const sql = buildInsertSQLFn(rowsObjs.length);
    await conn.query(sql, rowsObjs.flatMap(r => r.vals));
    return { inserted: rowsObjs.length, failed: [] };
  } catch (e) {
    if (rowsObjs.length === 1) {
      console.error(
        `[FILA FALLIDA] excelRow=${rowsObjs[0].rowNo} -> ${e.code || ""} ${e.message}`
      );
      return { inserted: 0, failed: [rowsObjs[0].rowNo] };
    }
    const mid = Math.floor(rowsObjs.length / 2);
    const left  = await insertBatchSafe(conn, rowsObjs.slice(0, mid), buildInsertSQLFn);
    const right = await insertBatchSafe(conn, rowsObjs.slice(mid), buildInsertSQLFn);
    return { inserted: left.inserted + right.inserted, failed: left.failed.concat(right.failed) };
  }
}

export async function loadOneFile(fullPath) {
  const fileName = path.basename(fullPath);
  const workbookReader = new Excel.stream.xlsx.WorkbookReader(fullPath, {
    entries: "emit",
    sharedStrings: "cache",
    styles: "emit",
    worksheets: "emit",
  });

  let insertedRows = 0;
  let failedRows = [];

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for await (const worksheetReader of workbookReader) {
      let headerReady = false;
      /** @type {Record<string, number>} */
      let colOf = {};
      let batch = [];
      let rowsInTxn = 0;

      for await (const row of worksheetReader) {
        const values = row.values || [];

        if (!headerReady) {
          // mapear encabezados
          const headers = values.map((v) => normalizeHeader(v));
          headers.forEach((h, idx) => {
            const mapped = HEADER_MAP[h];
            if (mapped) colOf[mapped] = idx;
          });
          headerReady = true;
          continue;
        }

        const get = (name) => values[colOf[name]];

        // ⚠️ Orden alineado a tu tabla/COLUMNS:
        // ... ZONA, FECHAULTLABOR, HORAULTLABOR, CODTAREA, LECTURA_ACTUAL, ...
        const recordArr = [
          toNull(get("CORRERIA")),
          toNull(get("INSTALACION")),
          toNull(get("CLIENTE")),
          toNull(get("MEDIDOR")),
          toNull(get("LECTOR")),
          toInt(get("ANO")),
          toInt(get("MES")),
          toInt(get("CICLO")),
          toInt(get("ZONA")),
          toDate(get("FECHAULTLABOR")),
          toTime(get("HORAULTLABOR")),   // ← HORA antes de CODTAREA (corrección)
          toNull(get("CODTAREA")),
          toInt(get("LECTURA_ACTUAL")),
          toInt(get("INTENTOS")),
          toInt(get("CODCAUSAOBS")),
          toNull(get("OBS_PREDIO")),
          toNull(get("OBS_TEXTO")),
          toNull(get("NUEVA")),
          toNull(get("COORDENADAS")),
          toInt(get("SECUENCIA")),
          toInt(get("ENTEROS")),
          toInt(get("DECIMALES")),
          toNull(get("SERVICIO")),
          toNull(get("UBICACION")),
        ];

        // Guardamos { valores, #filaExcel } para aislar errores si un INSERT falla
        batch.push({ vals: recordArr, rowNo: row.number });

        if (batch.length >= BATCH_SIZE) {
          const { inserted, failed } = await insertBatchSafe(conn, batch, buildInsertSQL);
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
        const { inserted, failed } = await insertBatchSafe(conn, batch, buildInsertSQL);
        insertedRows += inserted;
        if (failed.length) failedRows.push(...failed);
        rowsInTxn += inserted;
        batch = [];
      }
    }

    await conn.commit();
    return { ok: true, inserted: insertedRows, failedRows, file: fileName };
  } catch (err) {
    await conn.rollback();
    err.message = `Fallo cargando ${fileName}: ` + err.message;
    throw err;
  } finally {
    conn.release();
  }
}
