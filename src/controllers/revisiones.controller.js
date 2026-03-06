/**
 * @fileoverview Controlador para consultas de revisiones
 * @description Maneja las peticiones de búsqueda de revisiones en clientes_servicios
 */

import { asyncHandler } from '../middleware/asyncHandler.js';
import { findRevisionesByCliente } from '../services/revisiones.service.js';

/**
 * Busca todas las revisiones de un cliente
 * @async
 * @function getRevisionesByCliente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string|number} req.body.cliente - ID del cliente a buscar
 * @param {string} req.body.usuario - Usuario que realiza la consulta
 * @param {string} req.body.tipoConsulta - Tipo de consulta
 * @param {string} req.body.detalles - Detalles adicionales
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Respuesta JSON con las revisiones encontradas
 * @example
 * // POST /api/revisiones/consultar
 * // Request body:
 * // {
 * //   "cliente": "467222",
 * //   "usuario": "admin",
 * //   "tipoConsulta": "revisiones",
 * //   "detalles": "Consulta desde panel de control"
 * // }
 * //
 * // Response:
 * // {
 * //   "ok": true,
 * //   "count": 3,
 * //   "rows": [...]
 * // }
 */
export const getRevisionesByCliente = asyncHandler(async (req, res) => {
  const { cliente, usuario, tipoConsulta, detalles } = req.body || {};

  if (!cliente) {
    return res.status(400).json({
      ok: false,
      message: 'El campo "cliente" es requerido'
    });
  }

  const result = await findRevisionesByCliente(cliente, usuario, tipoConsulta, detalles);

  res.json(result);
});
