// src/controllers/medidores.controller.js
import { asyncHandler } from "../middleware/asyncHandler.js";
import { loadMedidoresFromExcel } from "../services/medidores.service.js";

/**
 * @fileoverview Controlador para carga masiva de medidores desde Excel
 * @description Permite cargar medidores desde archivos Excel a la base de datos
 */

/**
 * Carga medidores desde archivo Excel a la base de datos
 * @async
 * @function postLoadMedidores
 * @description Lee el archivo src/data/medidores.xlsx e inserta los medidores en la tabla de base de datos
 * @param {Object} _req - Objeto de solicitud Express (no utilizado)
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Respuesta JSON con el resultado de la carga
 * @example
 * // POST /api/medidores/load
 * // Respuesta:
 * // {
 * //   "ok": true,
 * //   "message": "Medidores cargados exitosamente",
 * //   "inserted": 1250,
 * //   "updated": 50,
 * //   "errors": []
 * // }
 */
export const postLoadMedidores = asyncHandler(async (_req, res) => {
  const result = await loadMedidoresFromExcel();
  res.json(result);
});
