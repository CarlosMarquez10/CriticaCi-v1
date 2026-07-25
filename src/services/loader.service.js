// src/services/loader.service.js
// Carga masiva de tiempos desde Excel → tabla `tiempos`
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
import { buildInsertSQL, COLUMNS } from "../utils/sql.js";

/** Lotes grandes = menos roundtrips a MySQL (ajustable con BATCH_SIZE) */
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 4000);

/** Commits menos frecuentes = más throughput (pensado para cargas ~800k) */
const TXN_ROWS = Number(process.env.TXN_ROWS || 60000);

/** Cada cuántas filas notificar progreso a la UI */
const PROGRESS_EVERY = Number(process.env.PROGRESS_EVERY || 10000);

const COL_COUNT = COLUMNS.length;

const HEADER_MAP = {
  CORRERIA: "CORRERIA",
  INSTALACION: "INSTALACION",
  CLIENTE: "CLIENTE",
  MEDIDOR: "MEDIDOR",
  LECTOR: "LECTOR",
  ANO: "ANO",
  ANIO: "ANO",
  AÑO: "ANO",
  MES: "MES",
  CICLO: "CICLO",
  ZONA: "ZONA",
  FECHAULTLABOR: "FECHAULTLABOR",
  FECHA_ULT_LABOR: "FECHAULTLABOR",
  HORAULTLABOR: "HORAULTLABOR",
  HORA_ULT_LABOR: "HORAULTLABOR",
  CODTAREA: "CODTAREA",
  LECTURA_ACT: "LECTURA_ACTUAL",
  LECTURA_ACTUAL: "LECTURA_ACTUAL",
  INTENTOS: "INTENTOS",
  CODCAUSAOBS: "CODCAUSAOBS",
  OBS_PREDIO: "OBS_PREDIO",
  OBS_TEXTO: "OBS_TEXTO",
  NUEVA: "NUEVA",
  COORDENADAS: "COORDENADAS",
  SECUENCIA: "SECUENCIA",
  ENTEROS: "ENTEROS",
  DECIMALES: "DECIMALES",
  SERVICIO: "SERVICIO",
  UBICACION: "UBICACION",
};

/** Cache de SQL por tamaño de lote (evita reconstruir placeholders) */
const sqlCache = new Map();
function getInsertSQL(batchLen) {
  let sql = sqlCache.get(batchLen);
  if (!sql) {
    sql = buildInsertSQL(batchLen);
    sqlCache.set(batchLen, sql);
  }
  return sql;
}

/** Aplana valores sin flatMap (menos GC) */
function flattenVals(rowsObjs) {
  const out = new Array(rowsObjs.length * COL_COUNT);
  let i = 0;
  for (let r = 0; r < rowsObjs.length; r++) {
    const vals = rowsObjs[r].vals;
    for (let c = 0; c < COL_COUNT; c++) out[i++] = vals[c];
  }
  return out;
}

/**
 * Inserta lote; si falla, divide en 2 hasta aislar filas malas.
 * Camino feliz = 1 query.
 */
async function insertBatchSafe(conn, rowsObjs) {
  try {
    await conn.query(getInsertSQL(rowsObjs.length), flattenVals(rowsObjs));
    return { inserted: rowsObjs.length, failed: [] };
  } catch (e) {
    if (rowsObjs.length === 1) {
      console.error(
        `[FILA FALLIDA] excelRow=${rowsObjs[0].rowNo} -> ${e.code || ""} ${e.message}`
      );
      return { inserted: 0, failed: [rowsObjs[0].rowNo] };
    }
    const mid = Math.floor(rowsObjs.length / 2);
    const left = await insertBatchSafe(conn, rowsObjs.slice(0, mid));
    const right = await insertBatchSafe(conn, rowsObjs.slice(mid));
    return {
      inserted: left.inserted + right.inserted,
      failed: left.failed.concat(right.failed),
    };
  }
}

/**
 * Intenta mapear una fila como encabezados reales del reporte.
 * Los Excel CENS traen 4–5 filas de título antes de CORRERIA/ANO/MES...
 * @returns {Record<string, number>|null}
 */
function tryMapHeaderRow(values) {
  /** @type {Record<string, number>} */
  const colOf = {};
  let mapped = 0;
  const headers = values.map((v) => normalizeHeader(v));
  headers.forEach((h, idx) => {
    const dest = HEADER_MAP[h];
    if (dest && colOf[dest] == null) {
      colOf[dest] = idx;
      mapped++;
    }
  });
  // Exigir columnas clave para no tomar una fila de título por error
  if (
    mapped >= 8 &&
    colOf.CORRERIA != null &&
    colOf.ANO != null &&
    colOf.MES != null
  ) {
    return colOf;
  }
  return null;
}

/**
 * @param {string} fullPath
 * @param {{ onProgress?: (p: { inserted: number, failedRows: number[] }) => void }} [options]
 */
export async function loadOneFile(fullPath, options = {}) {
  const { onProgress } = options;
  const fileName = path.basename(fullPath);
  const t0 = Date.now();

  const workbookReader = new Excel.stream.xlsx.WorkbookReader(fullPath, {
    entries: "emit",
    sharedStrings: "cache",
    styles: "ignore",
    worksheets: "emit",
  });

  let insertedRows = 0;
  let failedRows = [];
  let lastProgressAt = 0;

  const reportProgress = (force = false) => {
    if (typeof onProgress !== "function") return;
    if (!force && insertedRows - lastProgressAt < PROGRESS_EVERY) return;
    lastProgressAt = insertedRows;
    onProgress({ inserted: insertedRows, failedRows });
  };

  const conn = await pool.getConnection();

  try {
    // Acelera carga masiva (se restauran al liberar la conexión del pool)
    await conn.query("SET UNIQUE_CHECKS=0");
    await conn.query("SET FOREIGN_KEY_CHECKS=0");
    await conn.query("SET SESSION sql_log_bin=0").catch(() => {});

    await conn.beginTransaction();

    for await (const worksheetReader of workbookReader) {
      let headerReady = false;
      /** @type {Record<string, number>} */
      let colOf = {};
      /** @type {Array<{ vals: any[], rowNo: number }>} */
      let batch = [];
      let rowsInTxn = 0;

      // Índices resueltos una vez (evita lookups por nombre en cada fila)
      let idxCorreria,
        idxInstalacion,
        idxCliente,
        idxMedidor,
        idxLector,
        idxAno,
        idxMes,
        idxCiclo,
        idxZona,
        idxFecha,
        idxHora,
        idxCodTarea,
        idxLectura,
        idxIntentos,
        idxCodCausa,
        idxObsPredio,
        idxObsTexto,
        idxNueva,
        idxCoords,
        idxSecuencia,
        idxEnteros,
        idxDecimales,
        idxServicio,
        idxUbicacion;

      for await (const row of worksheetReader) {
        const values = row.values || [];

        if (!headerReady) {
          const mapped = tryMapHeaderRow(values);
          if (!mapped) continue; // saltar títulos / filas previas al header real
          colOf = mapped;
          console.log(
            `[loader] ${fileName}: encabezados detectados en fila Excel ${row.number}`
          );
          idxCorreria = colOf.CORRERIA;
          idxInstalacion = colOf.INSTALACION;
          idxCliente = colOf.CLIENTE;
          idxMedidor = colOf.MEDIDOR;
          idxLector = colOf.LECTOR;
          idxAno = colOf.ANO;
          idxMes = colOf.MES;
          idxCiclo = colOf.CICLO;
          idxZona = colOf.ZONA;
          idxFecha = colOf.FECHAULTLABOR;
          idxHora = colOf.HORAULTLABOR;
          idxCodTarea = colOf.CODTAREA;
          idxLectura = colOf.LECTURA_ACTUAL;
          idxIntentos = colOf.INTENTOS;
          idxCodCausa = colOf.CODCAUSAOBS;
          idxObsPredio = colOf.OBS_PREDIO;
          idxObsTexto = colOf.OBS_TEXTO;
          idxNueva = colOf.NUEVA;
          idxCoords = colOf.COORDENADAS;
          idxSecuencia = colOf.SECUENCIA;
          idxEnteros = colOf.ENTEROS;
          idxDecimales = colOf.DECIMALES;
          idxServicio = colOf.SERVICIO;
          idxUbicacion = colOf.UBICACION;
          headerReady = true;
          continue;
        }

        // Saltar filas vacías
        if (!values.length || values.every((v) => v == null || String(v).trim() === "")) {
          continue;
        }

        const ano = toInt(values[idxAno]);
        const mes = toInt(values[idxMes]);
        // Evitar basura si por alguna razón ANO/MES no vienen
        if (ano == null || mes == null) continue;

        const recordArr = [
          toNull(values[idxCorreria]),
          toNull(values[idxInstalacion]),
          toNull(values[idxCliente]),
          toNull(values[idxMedidor]),
          toNull(values[idxLector]),
          ano,
          mes,
          toInt(values[idxCiclo]),
          toInt(values[idxZona]),
          toDate(values[idxFecha]),
          toTime(values[idxHora]),
          toNull(values[idxCodTarea]),
          toInt(values[idxLectura]),
          toInt(values[idxIntentos]),
          toInt(values[idxCodCausa]),
          toNull(values[idxObsPredio]),
          toNull(values[idxObsTexto]),
          toNull(values[idxNueva]),
          toNull(values[idxCoords]),
          toInt(values[idxSecuencia]),
          toInt(values[idxEnteros]),
          toInt(values[idxDecimales]),
          toNull(values[idxServicio]),
          toNull(values[idxUbicacion]),
        ];

        batch.push({ vals: recordArr, rowNo: row.number });

        if (batch.length >= BATCH_SIZE) {
          const { inserted, failed } = await insertBatchSafe(conn, batch);
          insertedRows += inserted;
          if (failed.length) failedRows.push(...failed);
          rowsInTxn += inserted;
          batch = [];
          reportProgress();

          if (rowsInTxn >= TXN_ROWS) {
            await conn.commit();
            await conn.beginTransaction();
            rowsInTxn = 0;
          }
        }
      }

      if (!headerReady) {
        throw new Error(
          "No se encontró fila de encabezados (CORRERIA/ANO/MES). Revisa el Excel."
        );
      }

      if (batch.length) {
        const { inserted, failed } = await insertBatchSafe(conn, batch);
        insertedRows += inserted;
        if (failed.length) failedRows.push(...failed);
        batch = [];
      }
    }

    await conn.commit();
    reportProgress(true);

    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const rate = secs > 0 ? Math.round(insertedRows / (secs || 1)) : insertedRows;
    console.log(
      `[loader] ${fileName}: ${insertedRows} filas en ${secs}s (~${rate} filas/s), fallidas=${failedRows.length}`
    );

    return { ok: true, inserted: insertedRows, failedRows, file: fileName };
  } catch (err) {
    await conn.rollback();
    err.message = `Fallo cargando ${fileName}: ` + err.message;
    throw err;
  } finally {
    try {
      await conn.query("SET UNIQUE_CHECKS=1");
      await conn.query("SET FOREIGN_KEY_CHECKS=1");
    } catch {
      /* ignore */
    }
    conn.release();
  }
}
