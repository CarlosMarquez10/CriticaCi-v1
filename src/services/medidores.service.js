// src/services/medidores.service.js
// este modulo se usa para insertar los medidores desde el excel a la base de datos.
import Excel from "exceljs";
import path from "path";
import { pool } from "../connection/db.js";
import { normalizeHeader, toNull, toInt } from "../utils/normalize.js";

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);
const TXN_ROWS   = Number(process.env.TXN_ROWS || 20000);
const FILE_PATH  = path.join(process.cwd(), "src", "data", "medidores.xlsx");

// columnas en la tabla
const COLUMNS = [
  "cliente_medidor",
  "num_medidor",
  "marca_medidor",
  "tecnologia_medidor",
  "tipo_medidor",
];

// genera INSERT ... VALUES (...),(...),...
function buildInsertSQLMed(batchLen) {
  const placeholders = Array.from({ length: batchLen })
    .map(() => `(${COLUMNS.map(() => "?").join(",")})`)
    .join(",");
  return `INSERT INTO medidores (${COLUMNS.join(",")}) VALUES ${placeholders}`;
}

// inserta un lote; si falla, divide y aísla filas problemáticas
async function insertBatchSafe(conn, rowsObjs) {
  try {
    const sql = buildInsertSQLMed(rowsObjs.length);
    await conn.query(sql, rowsObjs.flatMap((r) => r.vals));
    return { inserted: rowsObjs.length, failed: [] };
  } catch (e) {
    if (rowsObjs.length === 1) {
      console.error(
        `[FILA FALLIDA MEDIDORES] excelRow=${rowsObjs[0].rowNo} -> ${e.code || ""} ${e.message}`,
      );
      return { inserted: 0, failed: [rowsObjs[0].rowNo] };
    }
    const mid = Math.floor(rowsObjs.length / 2);
    const left  = await insertBatchSafe(conn, rowsObjs.slice(0, mid));
    const right = await insertBatchSafe(conn, rowsObjs.slice(mid));
    return { inserted: left.inserted + right.inserted, failed: left.failed.concat(right.failed) };
  }
}

// Encabezado Excel -> columna destino (normaliza a MAYÚSCULA sin acentos)
const HEADER_MAP = {
  "CLIENTE_MEDIDOR": "cliente_medidor",
  "NUM_MEDIDOR": "num_medidor",
  "MARCA_MEDIDOR": "marca_medidor",
  "TECNOLOGIA_MEDIDOR": "tecnologia_medidor",
  "TECNOLOGIA MEDIDOR": "tecnologia_medidor",
  "TECNOLOGIA": "tecnologia_medidor",
  "TECNOLOGIA_MEDIDOR": "tecnologia_medidor",
  "TEC NLOGIA_MEDIDOR": "tecnologia_medidor", // por si viene con espacio raro
  "TEC NLOGIA MEDIDOR": "tecnologia_medidor",
  // alias con error de tipeo común:
  "TEC NLOGIA_MEDIDOR": "tecnologia_medidor",
  "TECNOLOGIA_MEDIDOR": "tecnologia_medidor",
  "TECNOLOGIA_MEDIDOR": "tecnologia_medidor",
  "TECNOLOGIA_MEDIDOR": "tecnologia_medidor",

  "TEC NLOGIA_MEDIDOR": "tecnologia_medidor",
  "TEC NLOGIA MEDIDOR": "tecnologia_medidor",
  // si llega "TECNLOGIA_MEDIDOR" (sin 'o'):
  "TECNLOGIA_MEDIDOR": "tecnologia_medidor",

  "TIPO_MEDIDOR": "tipo_medidor",
  "TIPO MEDIDOR": "tipo_medidor",
};

export async function loadMedidoresFromExcel() {
  const workbookReader = new Excel.stream.xlsx.WorkbookReader(FILE_PATH, {
    entries: "emit",
    sharedStrings: "cache",
    styles: "emit",
    worksheets: "emit",
  });

  const conn = await pool.getConnection();
  let insertedRows = 0;
  let failedRows = [];

  try {
    await conn.beginTransaction();

    for await (const worksheet of workbookReader) {
      let headerReady = false;
      /** @type {Record<string, number>} */
      let colOf = {};
      let batch = [];
      let rowsInTxn = 0;

      for await (const row of worksheet) {
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
        const toStr = (v) => (v === undefined || v === null ? null : String(v).trim());

        const recordArr = [
          toInt(get("cliente_medidor")),
          toStr(get("num_medidor")),
          toStr(get("marca_medidor")),
          toStr(get("tecnologia_medidor")),
          toStr(get("tipo_medidor")),
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

      if (batch.length) {
        const { inserted, failed } = await insertBatchSafe(conn, batch);
        insertedRows += inserted;
        if (failed.length) failedRows.push(...failed);
        batch = [];
      }
    }

    await conn.commit();
    return { ok: true, inserted: insertedRows, failedRows, file: path.basename(FILE_PATH) };
  } catch (err) {
    await conn.rollback();
    err.message = `Fallo cargando medidores: ` + err.message;
    throw err;
  } finally {
    conn.release();
  }
}
