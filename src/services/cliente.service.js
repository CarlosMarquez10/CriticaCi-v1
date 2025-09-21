// src/services/cliente.service.js
// Servicio para obtener todos los registros de un cliente en la tabla 'tiempos'.
import { pool } from "../connection/db.js";

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
 * Trae todos los registros de un cliente (todas las fechas o filtrando por periodo YYYYMM).
 * @param {string|number} clienteId
 * @param {{desde?: number, hasta?: number}} [opts]
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
