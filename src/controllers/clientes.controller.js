// src/controllers/clientes.controller.js
import { asyncHandler } from "../middleware/asyncHandler.js";
import { fetchRecordsByClientes } from "../services/clientes.service.js";

/**
 * @fileoverview Controlador para manejo de registros de múltiples clientes
 * @description Permite obtener registros de tiempo de múltiples clientes con filtros de fecha
 */

/**
 * Obtiene registros de tiempo para múltiples clientes
 * @async
 * @function postClientesRecords
 * @description Busca y retorna registros de tiempo para una lista de clientes con filtros opcionales de fecha
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {Array|Object} req.body.clientes - Lista de IDs de clientes o objeto con IDs como claves
 * @param {number} [req.body.desde] - Fecha de inicio en formato YYYYMM (opcional)
 * @param {number} [req.body.hasta] - Fecha de fin en formato YYYYMM (opcional)
 * @param {boolean} [req.body.planop=false] - Si true devuelve filas planas, si false agrupa por cliente
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Respuesta JSON con los registros encontrados
 * @throws {400} Error si no se proporcionan clientes válidos
 * @throws {413} Error si se excede el límite de 10,000 clientes
 * @example
 * // Solicitud con array de clientes
 * POST /api/clientes/records
 * {
 *   "clientes": [1170143751, "1160143703"],
 *   "desde": 202401,
 *   "hasta": 202512,
 *   "planop": false
 * }
 * 
 * // Solicitud con objeto de clientes
 * POST /api/clientes/records
 * {
 *   "clientes": {"1170143751": true, "1160143703": true},
 *   "planop": true
 * }
 */
export const postClientesRecords = asyncHandler(async (req, res) => {
  let { clientes, desde, hasta, planop } = req.body || {};

  // Soporta objeto de clientes { "id": true, ... }
  if (!Array.isArray(clientes) && clientes && typeof clientes === "object") {
    clientes = Object.keys(clientes);
  }

  if (!Array.isArray(clientes) || clientes.length === 0) {
    return res.status(400).json({ ok: false, message: "Envíe 'clientes' como arreglo u objeto con ids." });
  }

  // límite razonable por request
  if (clientes.length > 10000) {
    return res.status(413).json({ ok: false, message: "Máximo 10,000 clientes por solicitud." });
  }

  const { total, rows, grouped } = await fetchRecordsByClientes(clientes, { "desde":202401, "hasta":202512 });

  res.json({
    ok: true,
    total,
    desde: desde ?? null,
    hasta: hasta ?? null,
    clientes: planop ? undefined : Object.keys(grouped).length,
    data: planop ? rows : grouped
  });
});
