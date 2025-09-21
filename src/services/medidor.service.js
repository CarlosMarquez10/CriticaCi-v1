// src/services/medidor.service.js
// este modulo se usa para consultar los medidores en la base de datos.
import { pool } from "../connection/db.js";

const COLUMNS = [
  "id",
  "cliente_medidor",
  "num_medidor",
  "marca_medidor",
  "tecnologia_medidor",
  "tipo_medidor",
  "created_at",
].join(",");

/**
 * Consulta 1 cliente puntual (tu versión original; la dejo por si la necesitas).
 */
export async function fetchMedidorByCliente(clienteMedidor) {
  const id = String(clienteMedidor).trim();
  if (!id) return { cliente_medidor: null, total: 0, rows: [] };

  const sql = `
    SELECT ${COLUMNS}
    FROM medidores
    WHERE cliente_medidor = ?
    ORDER BY id
  `;
  const [rows] = await pool.query(sql, [id]);
  return { cliente_medidor: id, total: rows.length, rows };
}

/**
 * Consulta múltiples clientes en lotes con WHERE IN (...).
 * @param {Array<string|number>} clientes
 * @param {{chunkSize?: number}} options
 * @returns {Promise<{rows:any[], grouped: Record<string, any[]>}>}
 */
export async function fetchMedidoresByClientes(clientes = [], { chunkSize = 800 } = {}) {
  // normaliza y deduplica
  const ids = [...new Set(
    (clientes || [])
      .map(v => String(v ?? "").trim())
      .filter(Boolean)
  )];

  if (ids.length === 0) return { rows: [], grouped: {} };

  const allRows = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const slice = ids.slice(i, i + chunkSize);
    const placeholders = slice.map(() => "?").join(",");
    const sql = `
      SELECT ${COLUMNS}
      FROM medidores
      WHERE cliente_medidor IN (${placeholders})
      ORDER BY cliente_medidor, id
    `;
    const [rows] = await pool.query(sql, slice);
    allRows.push(...rows);
  }

  // agrupa por cliente_medidor
  const grouped = {};
  for (const r of allRows) {
    const key = String(r.cliente_medidor);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  return { rows: allRows, grouped };
}
