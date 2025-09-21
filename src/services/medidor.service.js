// src/services/medidor.service.js
// este modulo se usa para consultar los medidores en la base de datos.
import { pool } from "../connection/db.js";

/**
 * @fileoverview Servicio para consulta de medidores en la base de datos
 * @description Proporciona funciones para buscar medidores por cliente individual o múltiples clientes
 */

/**
 * Columnas de la tabla medidores que se seleccionan en las consultas
 * @constant {string} COLUMNS
 */
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
 * Consulta medidores de un cliente específico
 * @async
 * @function fetchMedidorByCliente
 * @description Busca todos los medidores asociados a un cliente específico
 * @param {string|number} clienteMedidor - ID del cliente medidor
 * @returns {Promise<{cliente_medidor: string|null, total: number, rows: Array}>} Información del cliente y sus medidores
 * @example
 * const result = await fetchMedidorByCliente("1170143751");
 * // result: {
 * //   cliente_medidor: "1170143751",
 * //   total: 3,
 * //   rows: [
 * //     { id: 1, cliente_medidor: "1170143751", num_medidor: "ABC123", ... },
 * //     { id: 2, cliente_medidor: "1170143751", num_medidor: "DEF456", ... }
 * //   ]
 * // }
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
 * Consulta medidores de múltiples clientes en lotes optimizados
 * @async
 * @function fetchMedidoresByClientes
 * @description Busca medidores para múltiples clientes usando consultas por lotes para optimizar rendimiento
 * @param {Array<string|number>} [clientes=[]] - Array de IDs de clientes medidor
 * @param {Object} [options={}] - Opciones de configuración
 * @param {number} [options.chunkSize=800] - Tamaño del lote para consultas WHERE IN
 * @returns {Promise<{rows: Array, grouped: Record<string, Array>}>} Medidores encontrados y agrupados por cliente
 * @example
 * const result = await fetchMedidoresByClientes(["1170143751", "1160143703"]);
 * // result: {
 * //   rows: [...], // todos los medidores encontrados
 * //   grouped: {
 * //     "1170143751": [{ id: 1, num_medidor: "ABC123", ... }],
 * //     "1160143703": [{ id: 2, num_medidor: "XYZ789", ... }]
 * //   }
 * // }
 * 
 * // Con tamaño de lote personalizado
 * const customResult = await fetchMedidoresByClientes(clientesList, { chunkSize: 500 });
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
