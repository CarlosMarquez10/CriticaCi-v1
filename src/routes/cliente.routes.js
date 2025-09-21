// src/routes/cliente.routes.js
/**
 * @fileoverview Rutas para operaciones de cliente individual
 * @description Define endpoints para consultar registros de un cliente específico
 */

import { Router } from "express";
import { postClienteRecords } from "../controllers/cliente.controller.js";

const router = Router();

/**
 * @route POST /api/cliente/records
 * @description Obtiene todos los registros (medidores) asociados a un cliente específico
 * @access Public
 * @param {Object} req.body - Datos del cliente
 * @param {string|number} req.body.cliente - ID del cliente a consultar
 * @returns {Object} 200 - Información del cliente y sus medidores
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // Request body:
 * // { "cliente": "1170143751" }
 * 
 * // Response:
 * // {
 * //   "cliente_medidor": "1170143751",
 * //   "total": 3,
 * //   "rows": [
 * //     { "id": 1, "cliente_medidor": "1170143751", "num_medidor": "ABC123", ... }
 * //   ]
 * // }
 */
router.post("/cliente/records", postClienteRecords);

export default router;
