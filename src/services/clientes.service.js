// src/services/clientes.service.js
//
import { pool } from "../connection/db.js";

const COLUMNS = [
  "id","correria","instalacion","cliente","medidor","lector",
  "ano","mes","ciclo","zona","fechaultlabor","horaultlabor",
  "codtarea","lectura_actual","intentos","codcausaobs",
  "obs_predio","obs_texto","nueva","coordenadas",
  "secuencia","enteros","decimales","servicio","ubicacion",
  "periodo","created_at"
].join(",");

// Divide un array en trozos de n elementos
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Trae todos los registros de la tabla 'tiempos' para un conjunto de clientes.
 * @param {Array<string|number>} clientes
 * @param {{desde?: number, hasta?: number}} [opts] periodo opcional (YYYYMM)
 * @returns {Promise<{total:number, rows:any[], grouped:Record<string, any[]>}>}
 */
export async function fetchRecordsByClientes(clientes, opts = {}) {
  const ids = [...new Set(clientes.map(String).map((s) => s.trim()).filter(Boolean))];
  if (ids.length === 0) return { total: 0, rows: [], grouped: {} };

  // Armamos filtros
  const where = [];
  const params = [];
  if (opts.desde && opts.hasta) {
    where.push("periodo BETWEEN ? AND ?");
    params.push(Number(opts.desde), Number(opts.hasta));
  } else if (opts.desde) {
    where.push("periodo >= ?");
    params.push(Number(opts.desde));
  } else if (opts.hasta) {
    where.push("periodo <= ?");
    params.push(Number(opts.hasta));
  }
  const whereSql = where.length ? ` AND ${where.join(" AND ")}` : "";

  // Evita IN gigantes: trozos de hasta 1000
  const chunks = chunk(ids, 1000);
  const rows = [];

  for (const part of chunks) {
    const sql = `
      SELECT ${COLUMNS}
      FROM tiempos
      WHERE cliente IN (${part.map(() => "?").join(",")})${whereSql}
      ORDER BY cliente, periodo, fechaultlabor, horaultlabor, id
    `;
    const [r] = await pool.query(sql, [...part, ...params]);
    rows.push(...r);
  }

  // Agrupar por cliente
  const grouped = {};
  for (const r of rows) {
    const key = String(r.cliente);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  return { total: rows.length, rows, grouped };
}
