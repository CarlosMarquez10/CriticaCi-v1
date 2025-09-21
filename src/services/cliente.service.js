// src/services/cliente.service.js
// Servicio para obtener todos los registros de un cliente en la tabla 'tiempos'.
import { pool } from "../connection/db.js";

/**
 * @fileoverview Servicio para manejo de registros de un cliente individual
 * @description Permite obtener registros de tiempo de un cliente específico con filtros de fecha
 */

/**
 * Columnas de la tabla tiempos que se seleccionan en las consultas
 * @constant {string} COLUMNS
 */
const COLUMNS = [
  "id","correria","instalacion","cliente","medidor","lector",
  "ano","mes","ciclo","zona",
  "fechaultlabor","horaultlabor",      // <-- con 't'
  "codtarea","lectura_actual","intentos","codcausaobs",
  "obs_predio","obs_texto","nueva","coordenadas",
  "secuencia","enteros","decimales","servicio","ubicacion",
  "periodo","created_at"
].join(",");

/**
 * Obtiene todos los registros de tiempo de un cliente específico
 * @async
 * @function fetchRecordsByCliente
 * @description Busca y retorna todos los registros de tiempo de un cliente, con filtros opcionales de período
 * @param {string|number} clienteId - ID del cliente a buscar
 * @param {Object} [opts={}] - Opciones de filtrado
 * @param {number} [opts.desde] - Período de inicio en formato YYYYMM
 * @param {number} [opts.hasta] - Período de fin en formato YYYYMM
 * @returns {Promise<{cliente: string|null, total: number, rows: Array}>} Objeto con información del cliente y sus registros
 * @example
 * // Buscar todos los registros de un cliente
 * const result = await fetchRecordsByCliente("1170143751");
 * // result: { cliente: "1170143751", total: 24, rows: [...] }
 * 
 * // Buscar registros con filtro de período
 * const filtered = await fetchRecordsByCliente("1170143751", {
 *   desde: 202401,
 *   hasta: 202412
 * });
 */
export async function fetchRecordsByCliente(clienteId, opts = {}) {
  const id = String(clienteId).trim();
  if (!id) return { cliente: null, total: 0, rows: [] };

  const where = ["cliente = ?"];
  const params = [id];

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

  const sql = `
    SELECT ${COLUMNS}
    FROM tiempos
    WHERE ${where.join(" AND ")}
    ORDER BY periodo, fechaultlabor, horaultlabor, id
  `;

  const [rows] = await pool.query(sql, params);
  return { cliente: id, total: rows.length, rows };
}
