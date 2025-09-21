// src/services/clientes.service.js
//
import { pool } from "../connection/db.js";

/**
 * @fileoverview Servicio para manejo de registros de múltiples clientes
 * @description Permite obtener registros de tiempo de múltiples clientes de forma eficiente
 */

/**
 * Columnas de la tabla tiempos que se seleccionan en las consultas
 * @constant {string} COLUMNS
 */
const COLUMNS = [
  "id","correria","instalacion","cliente","medidor","lector",
  "ano","mes","ciclo","zona","fechaultlabor","horaultlabor",
  "codtarea","lectura_actual","intentos","codcausaobs",
  "obs_predio","obs_texto","nueva","coordenadas",
  "secuencia","enteros","decimales","servicio","ubicacion",
  "periodo","created_at"
].join(",");

/**
 * Divide un array en trozos de tamaño específico para evitar consultas SQL muy grandes
 * @function chunk
 * @param {Array} arr - Array a dividir
 * @param {number} size - Tamaño de cada trozo
 * @returns {Array<Array>} Array de arrays con los elementos divididos
 * @example
 * chunk([1,2,3,4,5], 2) // [[1,2], [3,4], [5]]
 */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Obtiene registros de tiempo para múltiples clientes
 * @async
 * @function fetchRecordsByClientes
 * @description Busca y retorna registros de tiempo para una lista de clientes, agrupados por cliente
 * @param {Array<string|number>} clientes - Array de IDs de clientes
 * @param {Object} [opts={}] - Opciones de filtrado
 * @param {number} [opts.desde] - Período de inicio en formato YYYYMM
 * @param {number} [opts.hasta] - Período de fin en formato YYYYMM
 * @returns {Promise<{total: number, rows: Array, grouped: Record<string, Array>}>} Registros totales, filas y agrupados por cliente
 * @example
 * // Buscar registros de múltiples clientes
 * const result = await fetchRecordsByClientes(["1170143751", "1160143703"]);
 * // result: {
 * //   total: 48,
 * //   rows: [...],
 * //   grouped: {
 * //     "1170143751": [...],
 * //     "1160143703": [...]
 * //   }
 * // }
 * 
 * // Con filtro de período
 * const filtered = await fetchRecordsByClientes(
 *   ["1170143751", "1160143703"],
 *   { desde: 202401, hasta: 202412 }
 * );
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
