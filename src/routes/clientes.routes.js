// src/routes/clientes.routes.js
/**
 * @fileoverview Rutas para operaciones de múltiples clientes
 * @description Define endpoints para consultar registros de varios clientes simultáneamente
 */

import { Router } from "express";
import { postClientesRecords } from "../controllers/clientes.controller.js";

const router = Router();

/**
 * @route POST /api/clientes/records
 * @description Obtiene registros (medidores) de múltiples clientes en una sola consulta optimizada
 * @access Public
 * @param {Object} req.body - Datos de los clientes
 * @param {Array<string|number>} req.body.clientes - Array de IDs de clientes a consultar
 * @returns {Object} 200 - Medidores encontrados agrupados por cliente
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // Request body:
 * // { "clientes": ["1170143751", "1160143703", "1150143655"] }
 * 
 * // Response:
 * // {
 * //   "rows": [...], // todos los medidores encontrados
 * //   "grouped": {
 * //     "1170143751": [{ "id": 1, "num_medidor": "ABC123", ... }],
 * //     "1160143703": [{ "id": 2, "num_medidor": "XYZ789", ... }]
 * //   }
 * // }
 */
router.post("/clientes/records", postClientesRecords);

export default router;
